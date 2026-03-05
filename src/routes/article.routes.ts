import { Router } from 'express';
import articleController from '@/controllers/article.controller';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/rbac';
import { apiRateLimiter } from '@/middleware/rateLimiter';
import { Role } from '@/types';

const router = Router();

/**
 * Public Routes
 * No authentication required
 */

// Get public articles with filters
// GET /articles?category=Tech&author=John&q=keyword&page=1&size=10
router.get('/', articleController.getPublicArticles.bind(articleController));

/**
 * Author-Only Routes
 * Require authentication and author role
 * Note: /me must come before /:id to avoid route conflicts
 */

// Create a new article
// POST /articles
router.post(
  '/',
  apiRateLimiter,
  authenticate,
  requireRole(Role.author),
  articleController.create.bind(articleController)
);

// Get authenticated author's articles
// GET /articles/me?includeDeleted=true&page=1&size=10
router.get(
  '/me',
  apiRateLimiter,
  authenticate,
  requireRole(Role.author),
  articleController.getMyArticles.bind(articleController)
);

// Get article by ID (public view)
// GET /articles/:id
// Uses optional auth to track readerId if user is logged in
router.get('/:id', optionalAuth, articleController.getById.bind(articleController));

// Update an article
// PUT /articles/:id
router.put(
  '/:id',
  apiRateLimiter,
  authenticate,
  requireRole(Role.author),
  articleController.update.bind(articleController)
);

// Soft delete an article
// DELETE /articles/:id
router.delete(
  '/:id',
  apiRateLimiter,
  authenticate,
  requireRole(Role.author),
  articleController.delete.bind(articleController)
);

export default router;
