import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { successResponse } from '../../common/response';
import { assignRoleSchema } from './user.dto';

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

  assignRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = assignRoleSchema.parse(req.body);
      const result = await userService.assignRole(req.params.id, data.role);
      res.status(200).json(successResponse(result, 'Role assigned successfully'));
    } catch (err) {
      next(err);
    }
  },
};
