import { conversationRepository } from './conversation.repository';
import { prisma } from '../../config/prisma';

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
};
