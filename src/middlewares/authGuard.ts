import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../common/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authGuard = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
      data: {},
      errors: null,
    });
  }
  const token = authHeader.split('')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: {},
      errors: null,
    });
  }
};
