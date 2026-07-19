import { Request, Response, NextFunction } from 'express';
import { messageService } from './message.service';
import { messageQuerySchema } from './message.dto';
import { successResponse } from '../../common/response';

export const messageController = {
  findMany: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = messageQuerySchema.parse(req.query);
      const userId = req.user!.userId;
      
      const result = await messageService.findMany(userId, parsed);
      
      res.status(200).json(successResponse(result, 'Messages retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },
};
