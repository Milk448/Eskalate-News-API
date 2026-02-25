import { Router } from 'express';
import authController from '@/controllers/auth.controller';

const router = Router();

/**
 * Authentication Routes
 * Public routes - no authentication required
 */

// Register a new user
// POST /auth/register
router.post('/register', authController.register.bind(authController));

// Login user
// POST /auth/login
router.post('/login', authController.login.bind(authController));

export default router;
