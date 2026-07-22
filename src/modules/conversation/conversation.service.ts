import { conversationRepository } from './conversation.repository';
import { prisma } from '../../config/prisma';
import { createActivityLog } from '../../common/activityLog';
import { AppError } from '../../common/appError';
import { notificationQueue } from '../../jobs/notification.job';
import { notificationRepository } from '../notification/notification.repository';
import { SenderType, ConversationStatus } from '@prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetches the role names of a given user from the database.
 */
async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role.name);
}

// ── Service ──────────────────────────────────────────────────────────────────

export const conversationService = {
  /**
   * Creates a new OPEN conversation for a customer.
   * Does NOT auto-assign the creating user; assignment must be done explicitly.
   */
  create: async (customerId: string, creatorUserId: string) => {
    // Check the customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return conversationRepository.create(customerId, creatorUserId);
  },

  findMany: async (
    userId: string,
    query: {
      status?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    },
  ) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status as ConversationStatus | undefined;

    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes('ADMIN');

    const result = await conversationRepository.findMany({
      userId,
      isAdmin,
      status,
      assignedTo: query.assignedTo,
      page,
      limit,
    });

    return {
      items: result.data,
      pagination: result.meta,
    };
  },

  findById: async (id: string, userId: string) => {
    const conversation = await conversationRepository.findById(id);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Access control: only members of the conversation can view it
    const isMember = await conversationRepository.isMember(id, userId);
    if (!isMember) {
      throw new AppError('Access denied. You are not a member of this conversation.', 403);
    }

    return conversation;
  },

  sendMessage: async (
    conversationId: string,
    senderId: string,
    content: string,
    senderType: SenderType = SenderType.USER,
  ) => {
    // Validates conversation existence and membership (only for USER senders)
    if (senderType === SenderType.USER) {
      await conversationService.findById(conversationId, senderId);
    }

    const message = await conversationRepository.createMessage(
      conversationId,
      senderId,
      content,
      senderType,
    );

    // Notify active assigned staff if the sender is not the staff themselves
    const activeAssignment = await conversationRepository.getActiveAssignment(conversationId);
    if (activeAssignment && activeAssignment.userId !== senderId) {
      const payload = {
        userId: activeAssignment.userId,
        message: `New message in conversation ${conversationId}`,
        type: 'NEW_MESSAGE',
        conversationId,
        messageId: message.id,
      };

      try {
        await notificationQueue.add('send-notification', payload);
      } catch (err: any) {
        console.error('[Fallback] Failed to enqueue notification job. Redis might be down. Executing fallback directly. Error:', err.message);
        // Fallback: save directly to DB
        await notificationRepository
          .create(payload.userId, payload.message, payload.type, payload.conversationId, payload.messageId)
          .catch(dbErr => console.error('[Fallback Failed] Could not save notification to DB:', dbErr.message));
      }
    }

    return message;
  },

  getMessages: async (
    conversationId: string,
    userId: string,
    query: { page?: number; limit?: number },
  ) => {
    // Validates conversation existence and membership
    await conversationService.findById(conversationId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, total] = await Promise.all([
      conversationRepository.findMessages(conversationId, page, limit),
      conversationRepository.countMessages(conversationId),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ── Assignment & Status ──────────────────────────────────────────────────

  assign: async (conversationId: string, staffUserId: string, actorUserId: string) => {
    // 1. Check conversation exists
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // 2. Cannot assign a CLOSED conversation
    if (conversation.status === 'CLOSED') {
      throw new AppError('Cannot assign a CLOSED conversation. Please reopen it first.', 400);
    }

    // 3. Verify the target staff user exists, has STAFF role, and is active
    const staff = await prisma.user.findUnique({
      where: { id: staffUserId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!staff) {
      throw new AppError('Staff user not found', 404);
    }
    if (!staff.isActive) {
      throw new AppError('Cannot assign to an inactive staff member', 400);
    }
    const staffRoles = staff.userRoles.map((ur) => ur.role.name);
    if (!staffRoles.includes('STAFF')) {
      throw new AppError('The specified user does not have the STAFF role', 403);
    }

    // 4. Role-based access: STAFF can only assign conversations to themselves
    const actorRoles = await getUserRoles(actorUserId);
    const isAdmin = actorRoles.includes('ADMIN');
    if (!isAdmin && staffUserId !== actorUserId) {
      throw new AppError('STAFF can only assign conversations to themselves', 403);
    }

    const assignment = await conversationRepository.assign(conversationId, staffUserId);

    await createActivityLog({
      action: 'CONVERSATION_ASSIGNED',
      userId: actorUserId,
      entityType: 'CONVERSATION',
      entityId: conversationId,
      metadata: { assignedTo: staffUserId },
    }).catch(() => {});

    return assignment;
  },

  unassign: async (conversationId: string, actorUserId: string) => {
    // 1. Check conversation exists
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // 2. Check there is an active assignment
    const activeAssignment = await conversationRepository.getActiveAssignment(conversationId);
    if (!activeAssignment) {
      throw new AppError('No active assignment found for this conversation', 400);
    }

    // 3. Role-based access: STAFF can only unassign conversations assigned to themselves
    const actorRoles = await getUserRoles(actorUserId);
    const isAdmin = actorRoles.includes('ADMIN');
    if (!isAdmin && activeAssignment.userId !== actorUserId) {
      throw new AppError(
        'STAFF can only unassign conversations that are assigned to themselves',
        403,
      );
    }

    const result = await conversationRepository.unassign(conversationId);

    await createActivityLog({
      action: 'CONVERSATION_UNASSIGNED',
      userId: actorUserId,
      entityType: 'CONVERSATION',
      entityId: conversationId,
      metadata: { unassignedFrom: activeAssignment.userId },
    }).catch(() => {});

    return result;
  },

  close: async (conversationId: string, actorUserId: string) => {
    // 1. Check conversation exists
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // 2. Cannot close an already CLOSED conversation
    if (conversation.status === 'CLOSED') {
      throw new AppError('Conversation is already closed', 400);
    }

    // 3. Role-based access: STAFF can only close conversations assigned to themselves
    const actorRoles = await getUserRoles(actorUserId);
    const isAdmin = actorRoles.includes('ADMIN');
    if (!isAdmin) {
      const activeAssignment = await conversationRepository.getActiveAssignment(conversationId);
      if (!activeAssignment || activeAssignment.userId !== actorUserId) {
        throw new AppError(
          'STAFF can only close conversations that are assigned to themselves',
          403,
        );
      }
    }

    const result = await conversationRepository.close(conversationId);

    await createActivityLog({
      action: 'CONVERSATION_CLOSED',
      userId: actorUserId,
      entityType: 'CONVERSATION',
      entityId: conversationId,
      metadata: { previousStatus: conversation.status },
    }).catch(() => {});

    return result;
  },

  reopen: async (conversationId: string, actorUserId: string) => {
    // 1. Check conversation exists
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // 2. Can only reopen if CLOSED
    if (conversation.status !== 'CLOSED') {
      throw new AppError(
        `Cannot reopen a conversation with status: ${conversation.status}`,
        400,
      );
    }

    // 3. Role-based access: STAFF can only reopen conversations where they were the last assignee
    const actorRoles = await getUserRoles(actorUserId);
    const isAdmin = actorRoles.includes('ADMIN');
    if (!isAdmin) {
      const lastAssignment = await prisma.assignment.findFirst({
        where: { conversationId },
        orderBy: { assignedAt: 'desc' },
      });
      if (!lastAssignment || lastAssignment.userId !== actorUserId) {
        throw new AppError(
          'STAFF can only reopen conversations that were previously assigned to themselves',
          403,
        );
      }
    }

    const result = await conversationRepository.reopen(conversationId);

    await createActivityLog({
      action: 'CONVERSATION_REOPENED',
      userId: actorUserId,
      entityType: 'CONVERSATION',
      entityId: conversationId,
      metadata: {},
    }).catch(() => {});

    return result;
  },
};
