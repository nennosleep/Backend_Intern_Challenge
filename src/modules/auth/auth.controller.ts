import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authGuard';
import { loginSchema, registerSchema } from './auth.dto';
import { authService } from './auth.service';
import { successResponse } from '../../common/response';

export const authController = {
  register: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const user = await authService.register(parsed);
      res.status(201).json(successResponse(user, 'Register successful'));
    } catch (error) {
      next(error);
    }
  },

  login: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.login(parsed);
      res.status(200).json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  },

  profile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const user = await authService.getProfile(userId);
      res.status(200).json(successResponse(user, 'Profile retrieved'));
    } catch (error) {
      next(error);
    }
  },
};
