import { Router } from 'express';
import dashboardController from '@/controllers/dashboard.controller';
import { authenticate } from '@/middleware/auth';
import { requireRole } from '@/middleware/rbac';
import { Role } from '@/types';

const router = Router();

/**
 * Author Dashboard Routes
 * All routes require authentication and author role
 */

// Get author dashboard with article analytics
// GET /author/dashboard?page=1&size=10
router.get(
  '/dashboard',
  authenticate,
  requireRole(Role.author),
  dashboardController.getDashboard.bind(dashboardController)
);

export default router;
