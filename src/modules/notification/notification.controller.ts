import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { notificationQuerySchema } from './notification.dto';
import { successResponse } from '../../common/response';

export const notificationController = {
  findMany: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = notificationQuerySchema.parse(req.query);
      const userId = req.user!.userId;
      const result = await notificationService.findMany(userId, parsed);
      res.status(200).json(successResponse(result, 'Notifications retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.markAsRead(req.params.id, userId);
      res.status(200).json(successResponse(result, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  },
};
