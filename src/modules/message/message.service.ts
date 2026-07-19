import { messageRepository } from './message.repository';
import { prisma } from '../../config/prisma';

async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role.name);
}

export const messageService = {
  findMany: async (
    userId: string,
    query: {
      conversationId?: string;
      keyword?: string;
      page?: number;
      limit?: number;
    },
  ) => {
    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes('ADMIN');

    const result = await messageRepository.findMany({
      userId,
      isAdmin,
      conversationId: query.conversationId,
      keyword: query.keyword,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });

    return {
      items: result.data,
      pagination: result.meta,
    };
  },
};
