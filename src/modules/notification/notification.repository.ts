import { prisma } from '../../config/prisma';

export const notificationRepository = {
  create: async (userId: string, content: string) => {
    return prisma.notification.create({
      data: {
        userId,
        content,
      },
    });
  },

  findManyByUserId: async (userId: string, page: number, limit: number) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  countByUserId: async (userId: string) => {
    return prisma.notification.count({
      where: { userId },
    });
  },

  findById: async (id: string) => {
    return prisma.notification.findUnique({
      where: { id },
    });
  },

  markAsRead: async (id: string) => {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },
};
