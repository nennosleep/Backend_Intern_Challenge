import { Response, NextFunction } from 'express';
import { AuthRequest } from './authGuard';
import { errorResponse } from '../common/response';
import { prisma } from '../config/prisma';

export const roleGuard = (allowedRoles: string[], options?: { strict?: boolean }) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    let userRoles = req.user?.roles || [];
    
    // If strict mode, verify against database to prevent stale JWT roles
    if (options?.strict && req.user?.userId) {
      try {
        const dbRoles = await prisma.userRole.findMany({
          where: { userId: req.user.userId },
          include: { role: true }
        });
        userRoles = dbRoles.map(ur => ur.role.name);
      } catch (err) {
        return res.status(500).json(errorResponse('Failed to verify user roles'));
      }
    }
    
    const hasPermission = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasPermission) {
      return res.status(403).json(
        errorResponse(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
};
