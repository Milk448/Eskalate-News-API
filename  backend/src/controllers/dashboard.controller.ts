import { Response, NextFunction } from 'express';
import analyticsService from '@/services/analytics.service';
import { sendPaginated } from '@/utils/response';
import { AuthRequest } from '@/types';
import { z } from 'zod';

const dashboardQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(10),
});

export class DashboardController {
  /**
   * Get author dashboard with analytics
   * GET /author/dashboard
   * Requirements: 8.1-8.6
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const { page, size } = dashboardQuerySchema.parse(req.query);

      // Get dashboard data for authenticated author
      const result = await analyticsService.getAuthorDashboard(req.user!.sub, page, size);

      sendPaginated(res, 'Dashboard data retrieved successfully', {
        data: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        size: result.pagination.size,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
