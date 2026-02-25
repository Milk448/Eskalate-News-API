import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, AppError } from '@/types';
import { env } from '@/config/env';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user payload to request
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', ['No valid authentication token provided']);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Validate payload structure
    if (!decoded.sub || !decoded.role) {
      throw new AppError(401, 'Invalid authentication token', ['Token payload is malformed']);
    }

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Authentication token has expired', []));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid authentication token', []));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      if (decoded.sub && decoded.role) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth - just don't attach user
    next();
  }
}
