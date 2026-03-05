import { Response, NextFunction } from 'express';
import { Role } from '@/types';
import { AuthRequest, AppError } from '@/types';

/**
 * Role-based access control middleware factory
 * Creates middleware that checks if user has required role
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    // User should be attached by authenticate middleware
    if (!req.user) {
      throw new AppError(401, 'Authentication required', ['You must be logged in to access this resource']);
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        'Insufficient permissions',
        [`This resource requires ${allowedRoles.join(' or ')} role`]
      );
    }

    next();
  };
}

/**
 * Convenience middleware for author-only routes
 */
export const requireAuthor = requireRole(Role.author);

/**
 * Convenience middleware for reader-only routes
 */
export const requireReader = requireRole(Role.reader);

/**
 * Middleware that allows both authors and readers
 */
export const requireAuthenticated = requireRole(Role.author, Role.reader);
