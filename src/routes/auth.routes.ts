import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { authRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

/**
 * Authentication Routes
 * Public routes - no authentication required
 */

// Register a new user
// POST /auth/register
router.post('/register', authRateLimiter, authController.register.bind(authController));

// Login user
// POST /auth/login
router.post('/login', authRateLimiter, authController.login.bind(authController));

export default router;
