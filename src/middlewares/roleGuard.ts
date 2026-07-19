import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from './authGuard';

/**
 * Factory middleware that checks if the authenticated user has at least one
 * of the specified roles (looked up from the database via user_roles → roles).
 *
 * Usage: roleGuard('ADMIN', 'STAFF')
 */
export const roleGuard = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: {},
        errors: null,
      });
    }

    // Query user roles from database
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const roleNames = userRoles.map((ur) => ur.role.name);
    const hasPermission = allowedRoles.some((r) => roleNames.includes(r));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        data: {},
        errors: null,
      });
    }

    next();
  };
};
