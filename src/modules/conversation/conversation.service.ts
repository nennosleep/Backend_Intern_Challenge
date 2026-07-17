import { conversationRepository } from './conversation.repository';
import { prisma } from '../../config/prisma';
import { createActivityLog } from '../../common/activityLog';
import { AppError } from '../../common/appError';

export const conversationService = {
  /**
   * Creates a new OPEN conversation for a customer.
   * Does NOT auto-assign; status starts as OPEN.
   */
  create: async (customerId: string) => {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return conversationRepository.create(customerId);
  },

  findMany: async (userId: string, query: { page?: number; limit?: number }) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

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

  sendMessage: async (conversationId: string, userId: string, content: string) => {
    // Validates conversation existence and membership
    await conversationService.findById(conversationId, userId);

    return conversationRepository.createMessage(conversationId, userId, content);
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
};
