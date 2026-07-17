import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { successResponse } from '../../common/response';

export const userController = {
  findMany: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.findMany();
      res.status(200).json(successResponse(users, 'Users retrieved'));
    } catch (err) {
      next(err);
    }
  },

  findById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.findById(req.params.id);
      res.status(200).json(successResponse(user, 'User retrieved'));
    } catch (err) {
      next(err);
    }
  },
};
