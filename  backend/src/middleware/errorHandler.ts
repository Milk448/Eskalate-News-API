import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '@/types';
import { sendError } from '@/utils/response';
import logger from '@/config/logger';

/**
 * Global error handler middleware
 * Catches all errors and formats them according to API response standards
 * Ensures no stack traces or internal details leak to clients
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Log the error for debugging (with stack trace)
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    });
    return sendError(res, 'Validation failed', errors, 400);
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = (err.meta?.target as string[])?.join(', ') || 'field';
        return sendError(
          res,
          'Resource already exists',
          [`Duplicate entry for ${field}`],
          409
        );
      }
      case 'P2025': {
        // Record not found
        return sendError(res, 'Resource not found', ['The requested resource does not exist'], 404);
      }
      case 'P2003': {
        // Foreign key constraint violation
        return sendError(
          res,
          'Invalid reference',
          ['Referenced resource does not exist'],
          400
        );
      }
      default: {
        logger.error('Unhandled Prisma error:', err);
        return sendError(res, 'Database operation failed', [], 500);
      }
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, 'Invalid data provided', ['Data validation failed'], 400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', [], 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', [], 401);
  }

  // Default error - don't expose internals
  logger.error('Unhandled error:', err);
  return sendError(res, 'An unexpected error occurred', [], 500);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
