import { conversationRepository } from './conversation.repository';
import { prisma } from '../../config/prisma';
import { createActivityLog } from '../../common/activityLog';


export const conversationService = {
  create: async (customerId: string, userId: string) => {
    // 1. Kiểm tra khách hàng có tồn tại không
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      const error: any = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }

    return conversationRepository.create(customerId, userId);
  },

  findMany: async (userId: string, query: { page?: number; limit?: number }) => {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [items, total] = await Promise.all([
      conversationRepository.findManyByUserId(userId, page, limit),
      conversationRepository.countByUserId(userId),
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

  findById: async (id: string, userId: string) => {
    // 1. Tìm kiếm hội thoại
    const conversation = await conversationRepository.findById(id);
    if (!conversation) {
      const error: any = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Ràng buộc quyền: Chỉ thành viên trong hội thoại mới được xem
    const isMember = await conversationRepository.isMember(id, userId);
    if (!isMember) {
      const error: any = new Error('Access denied. You are not a member of this conversation.');
      error.statusCode = 403;
      throw error;
    }

    return conversation;
  },

  sendMessage: async (conversationId: string, userId: string, content: string) => {
    // 1. Xác thực xem hội thoại có tồn tại và người gửi có phải là thành viên không
    await conversationService.findById(conversationId, userId);

    return conversationRepository.createMessage(conversationId, userId, content);
  },

  getMessages: async (conversationId: string, userId: string, query: { page?: number; limit?: number }) => {
    // 1. Xác thực xem hội thoại có tồn tại và người dùng có phải là thành viên không
    await conversationService.findById(conversationId, userId);

    const page = query.page || 1;
    const limit = query.limit || 50; // Mặc định tải 50 tin gần nhất

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
    // 1. Kiểm tra conversation tồn tại
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      const error: any = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Không assign nếu đã CLOSED
    if (conversation.status === 'CLOSED') {
      const error: any = new Error('Cannot assign a CLOSED conversation. Please reopen it first.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Kiểm tra staff tồn tại
    const staff = await prisma.user.findUnique({ where: { id: staffUserId } });
    if (!staff) {
      const error: any = new Error('Staff user not found');
      error.statusCode = 404;
      throw error;
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
    // 1. Kiểm tra conversation tồn tại
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      const error: any = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Kiểm tra có assignment đang active không
    const activeAssignment = await conversationRepository.getActiveAssignment(conversationId);
    if (!activeAssignment) {
      const error: any = new Error('No active assignment found for this conversation');
      error.statusCode = 400;
      throw error;
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
    // 1. Kiểm tra conversation tồn tại
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      const error: any = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Không close nếu đã CLOSED rồi
    if (conversation.status === 'CLOSED') {
      const error: any = new Error('Conversation is already closed');
      error.statusCode = 400;
      throw error;
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
    // 1. Kiểm tra conversation tồn tại
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      const error: any = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Chỉ có thể reopen nếu đang CLOSED
    if (conversation.status !== 'CLOSED') {
      const error: any = new Error(`Cannot reopen a conversation with status: ${conversation.status}`);
      error.statusCode = 400;
      throw error;
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
