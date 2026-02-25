import { Request, Response, NextFunction } from 'express';
import articleService from '@/services/article.service';
import readLogService from '@/services/readLog.service';
import {
  createArticleSchema,
  updateArticleSchema,
  articleFiltersSchema,
  articleIdSchema,
} from '@/validators/article.validator';
import { sendSuccess, sendPaginated } from '@/utils/response';
import { AuthRequest } from '@/types';

export class ArticleController {
  /**
   * Create a new article (Author only)
   * POST /articles
   * Requirements: 3.1-3.5
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = createArticleSchema.parse(req.body);

      // Create article
      const article = await articleService.create(req.user!.sub, validatedData);

      sendSuccess(res, 'Article created successfully', article, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get articles by authenticated author (Author only)
   * GET /articles/me
   * Requirements: 3.8, 4.5
   */
  async getMyArticles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const filters = articleFiltersSchema.parse(req.query);

      // Get author's articles
      const result = await articleService.getAuthorArticles(req.user!.sub, filters);

      sendPaginated(res, 'Articles retrieved successfully', {
        data: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        size: result.pagination.size,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an article (Author only)
   * PUT /articles/:id
   * Requirements: 3.6, 3.7
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate article ID
      const { id } = articleIdSchema.parse(req.params);

      // Validate request body
      const validatedData = updateArticleSchema.parse(req.body);

      // Update article
      const article = await articleService.update(id, req.user!.sub, validatedData);

      sendSuccess(res, 'Article updated successfully', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete an article (Author only)
   * DELETE /articles/:id
   * Requirements: 4.1, 4.2, 4.3
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate article ID
      const { id } = articleIdSchema.parse(req.params);

      // Delete article
      await articleService.delete(id, req.user!.sub);

      sendSuccess(res, 'Article deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public articles with filters (Public)
   * GET /articles
   * Requirements: 5.1-5.6
   */
  async getPublicArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const filters = articleFiltersSchema.parse(req.query);

      // Get public articles
      const result = await articleService.getPublicArticles(filters);

      sendPaginated(res, 'Articles retrieved successfully', {
        data: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        size: result.pagination.size,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get article by ID (Public)
   * GET /articles/:id
   * Requirements: 6.1, 6.2, 6.3, 6.6
   * Tracks read events asynchronously without blocking response
   * Implements duplicate read prevention using Redis throttling
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate article ID
      const { id } = articleIdSchema.parse(req.params);

      // Get article
      const article = await articleService.getByIdWithAuthor(id);

      // Track read event asynchronously (fire-and-forget)
      // Extract readerId from JWT if user is authenticated
      const readerId = req.user?.sub;
      
      // Get IP address for guest throttling
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      // Don't await - let it process in background with throttling
      readLogService.recordRead(id, readerId, ipAddress).catch(() => {
        // Error is already logged in readLogService, just ensure it doesn't propagate
      });

      sendSuccess(res, 'Article retrieved successfully', article);
    } catch (error) {
      next(error);
    }
  }
}

export default new ArticleController();
