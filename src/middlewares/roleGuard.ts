import { Response, NextFunction } from 'express';
import { AuthRequest } from './authGuard';
import { errorResponse } from '../common/response';

/**
 * Factory middleware that checks if the authenticated user has at least one
 * of the specified roles (looked up from the JWT payload).
 *
 * Usage: roleGuard('ADMIN', 'STAFF')
 */
export const roleGuard = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    
    // Check if user has at least one of the allowed roles
    const hasPermission = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasPermission) {
      return res.status(403).json(
        errorResponse(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
};
