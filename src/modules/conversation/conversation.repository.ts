import { prisma } from '../../config/prisma';
import { ConversationStatus, ParticipantType, SenderType } from '@prisma/client';

export const conversationRepository = {
  /**
   * Creates a new OPEN conversation and adds the customer and creator as members.
   * Staff assignment must be done explicitly via the assign() method.
   */
  create: async (customerId: string, creatorUserId: string) => {
    return prisma.$transaction(async (tx) => {
      // 1. Create new conversation with OPEN status (no auto-assign)
      const conversation = await tx.conversation.create({
        data: {
          customerId,
          status: ConversationStatus.OPEN,
        },
      });

      // 2. Add the customer as a member of the conversation
      await tx.conversationMember.create({
        data: {
          conversationId: conversation.id,
          participantType: ParticipantType.CUSTOMER,
          customerId: customerId,
        },
      });

      // The authenticated user who created the conversation must be able to
      // access it immediately. Membership is independent from assignment.
      await tx.conversationMember.create({
        data: {
          conversationId: conversation.id,
          participantType: ParticipantType.USER,
          userId: creatorUserId,
        },
      });

      return conversation;
    });
  },

  findManyByUserId: async (userId: string, page: number, limit: number) => {
    return prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  },

  countByUserId: async (userId: string) => {
    return prisma.conversation.count({
      where: {
        members: {
          some: { userId },
        },
      },
    });
  },

  findById: async (id: string) => {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        members: true,
      },
    });
  },

  isMember: async (conversationId: string, userId: string) => {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId },
    });
    return !!member;
  },

  createMessage: async (conversationId: string, senderId: string, content: string) => {
    return prisma.$transaction(async (tx) => {
      // 1. Create the message
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          senderType: SenderType.USER,
          content,
        },
      });

      // 2. Update the conversation's updatedAt timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  },

  findMessages: async (conversationId: string, page: number, limit: number) => {
    return prisma.message.findMany({
      where: { conversationId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { sentAt: 'asc' },
    });
  },

  countMessages: async (conversationId: string) => {
    return prisma.message.count({
      where: { conversationId },
    });
  },

  // ── Assignment & Status ──────────────────────────────────────────────────

  getActiveAssignment: async (conversationId: string) => {
    return prisma.assignment.findFirst({
      where: { conversationId, isActive: true },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  /**
   * Assigns a conversation to a staff member.
   * Uses a serializable transaction with raw SQL locking to prevent race conditions,
   * ensuring only one active assignment can exist per conversation at any time.
   */
  assign: async (conversationId: string, staffUserId: string) => {
    return prisma.$transaction(
      async (tx) => {
        // Row-level lock: prevent concurrent assign on the same conversation
        await tx.$executeRaw`SELECT id FROM conversations WHERE id = ${conversationId}::uuid FOR UPDATE`;

        // Deactivate all existing active assignments for this conversation
        await tx.assignment.updateMany({
          where: { conversationId, isActive: true },
          data: { isActive: false, unassignedAt: new Date() },
        });

        // Create new active assignment
        const assignment = await tx.assignment.create({
          data: { conversationId, userId: staffUserId, isActive: true },
        });

        // Update conversation status to ASSIGNED
        await tx.conversation.update({
          where: { id: conversationId },
          data: { status: ConversationStatus.ASSIGNED },
        });

        // Add staff as a member if not already a member
        const existingMember = await tx.conversationMember.findFirst({
          where: { conversationId, userId: staffUserId },
        });
        if (!existingMember) {
          await tx.conversationMember.create({
            data: {
              conversationId,
              participantType: ParticipantType.USER,
              userId: staffUserId,
            },
          });
        }

        return assignment;
      },
      { isolationLevel: 'Serializable' },
    );
  },

  unassign: async (conversationId: string) => {
    return prisma.$transaction(
      async (tx) => {
        // Row-level lock
        await tx.$executeRaw`SELECT id FROM conversations WHERE id = ${conversationId}::uuid FOR UPDATE`;

        // Deactivate active assignment
        await tx.assignment.updateMany({
          where: { conversationId, isActive: true },
          data: { isActive: false, unassignedAt: new Date() },
        });

        // Update conversation status back to OPEN
        return tx.conversation.update({
          where: { id: conversationId },
          data: { status: ConversationStatus.OPEN },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  },

  close: async (conversationId: string) => {
    return prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT id FROM conversations WHERE id = ${conversationId}::uuid FOR UPDATE`;
        return tx.conversation.update({
          where: { id: conversationId },
          data: { status: ConversationStatus.CLOSED },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  },

  reopen: async (conversationId: string) => {
    return prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT id FROM conversations WHERE id = ${conversationId}::uuid FOR UPDATE`;
        return tx.conversation.update({
          where: { id: conversationId },
          data: { status: ConversationStatus.OPEN },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  },
};
