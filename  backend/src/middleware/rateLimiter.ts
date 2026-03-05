import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

// Skip rate limiting in test environment
const skipInTest = process.env.NODE_ENV === 'test';

/**
 * General API rate limiter
 * Applied to all authenticated routes
 */
export const apiRateLimiter: RequestHandler = skipInTest
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        Success: false,
        Message: 'Too many requests',
        Object: null,
        Errors: ['Too many requests, please try again later'],
      },
    });

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute-force attacks on login
 */
export const authRateLimiter: RequestHandler = skipInTest
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 attempts per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        Success: false,
        Message: 'Too many authentication attempts',
        Object: null,
        Errors: ['Too many authentication attempts, please try again later'],
      },
    });
