import { notificationRepository } from './notification.repository';
import { AppError } from '../../common/appError';

export const notificationService = {
  findMany: async (userId: string, query: { page?: number; limit?: number }) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, total] = await Promise.all([
      notificationRepository.findManyByUserId(userId, page, limit),
      notificationRepository.countByUserId(userId),
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

  markAsRead: async (id: string, userId: string) => {
    const notification = await notificationRepository.findById(id);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Access denied. You can only mark your own notifications as read.', 403);
    }

    if (notification.isRead) {
      return notification; // Already read
    }

    return notificationRepository.markAsRead(id);
  },
};
