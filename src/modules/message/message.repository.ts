import { prisma } from '../../config/prisma';

export const messageRepository = {
  findMany: async (params: {
    userId: string;
    isAdmin: boolean;
    conversationId?: string;
    keyword?: string;
    page: number;
    limit: number;
  }) => {
    const { userId, isAdmin, conversationId, keyword, page, limit } = params;

    const where: any = {};

    if (!isAdmin) {
      // Normal user can only search in conversations they are members of
      where.conversation = {
        members: {
          some: { userId },
        },
      };
    }

    if (conversationId) {
      where.conversationId = conversationId;
    }

    if (keyword) {
      where.content = {
        contains: keyword,
        mode: 'insensitive',
      };
    }

    const [data, total] = await prisma.$transaction([
      prisma.message.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
