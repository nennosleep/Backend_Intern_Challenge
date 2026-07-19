import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/appError';

/**
 * Middleware to secure webhook endpoints by verifying the 'x-webhook-secret' header.
 */
export const webhookGuard = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers['x-webhook-secret'];
  const expectedSecret = process.env.WEBHOOK_SECRET || 'default-secret-for-dev';

  if (!secret) {
    return next(new AppError('Missing x-webhook-secret header', 401));
  }

  if (secret !== expectedSecret) {
    return next(new AppError('Invalid webhook secret', 403));
  }

  next();
};
