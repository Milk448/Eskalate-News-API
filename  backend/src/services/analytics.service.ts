import prisma from '@/config/database';
import logger from '@/config/logger';
import { PaginatedResult } from '@/repositories/article.repository';

export interface DashboardItem {
  id: string;
  title: string;
  createdAt: Date;
  totalViews: number;
  category: string;
  status: string;
}

export class AnalyticsService {
  /**
   * Aggregate daily analytics for a specific date
   * Groups ReadLog entries by articleId and date (GMT)
   * Upserts into DailyAnalytics table
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
   */
  async aggregateDailyAnalytics(date: Date): Promise<void> {
    try {
      // Ensure date is in GMT and set to start of day
      const targetDate = new Date(date);
      targetDate.setUTCHours(0, 0, 0, 0);

      // Calculate end of day in GMT
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      logger.info(`Aggregating analytics for ${targetDate.toISOString().split('T')[0]}`);

      // Group ReadLog entries by articleId for the target date
      const readCounts = await prisma.readLog.groupBy({
        by: ['articleId'],
        where: {
          readAt: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        _count: {
          id: true,
        },
      });

      logger.info(`Found ${readCounts.length} articles with reads on ${targetDate.toISOString().split('T')[0]}`);

      // Upsert analytics for each article
      for (const { articleId, _count } of readCounts) {
        await prisma.dailyAnalytics.upsert({
          where: {
            articleId_date: {
              articleId,
              date: targetDate,
            },
          },
          update: {
            viewCount: _count.id,
          },
          create: {
            articleId,
            date: targetDate,
            viewCount: _count.id,
          },
        });
      }

      logger.info(`Successfully aggregated analytics for ${readCounts.length} articles`);
    } catch (error) {
      logger.error('Failed to aggregate daily analytics:', error);
      throw error;
    }
  }

  /**
   * Get author dashboard with article analytics
   * Returns paginated list of articles with total views
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   */
  async getAuthorDashboard(
    authorId: string,
    page: number = 1,
    size: number = 10
  ): Promise<PaginatedResult<DashboardItem>> {
    try {
      // Calculate pagination
      const skip = (page - 1) * size;

      // Get total count of non-deleted articles by author
      const total = await prisma.article.count({
        where: {
          authorId,
          deletedAt: null,
        },
      });

      // Get articles with aggregated view counts
      const articles = await prisma.article.findMany({
        where: {
          authorId,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          category: true,
          status: true,
          dailyAnalytics: {
            select: {
              viewCount: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: size,
      });

      // Transform data and calculate total views
      const dashboardItems: DashboardItem[] = articles.map((article) => {
        const totalViews = article.dailyAnalytics.reduce(
          (sum, analytics) => sum + analytics.viewCount,
          0
        );

        return {
          id: article.id,
          title: article.title,
          createdAt: article.createdAt,
          totalViews,
          category: article.category,
          status: article.status,
        };
      });

      const totalPages = Math.ceil(total / size);

      return {
        data: dashboardItems,
        pagination: {
          page,
          size,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get author dashboard:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific article
   * Returns daily breakdown of views
   */
  async getArticleAnalytics(
    articleId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ date: Date; viewCount: number }>> {
    const where: any = {
      articleId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const analytics = await prisma.dailyAnalytics.findMany({
      where,
      select: {
        date: true,
        viewCount: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return analytics;
  }

  /**
   * Get total views for an article
   */
  async getTotalViews(articleId: string): Promise<number> {
    const result = await prisma.dailyAnalytics.aggregate({
      where: {
        articleId,
      },
      _sum: {
        viewCount: true,
      },
    });

    return result._sum.viewCount || 0;
  }

  /**
   * Get top articles by views
   * Useful for trending/popular articles
   */
  async getTopArticles(limit: number = 10): Promise<DashboardItem[]> {
    const articles = await prisma.article.findMany({
      where: {
        deletedAt: null,
        status: 'Published',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        category: true,
        status: true,
        dailyAnalytics: {
          select: {
            viewCount: true,
          },
        },
      },
      take: limit * 2, // Get more to sort by views
    });

    // Calculate total views and sort
    const articlesWithViews = articles
      .map((article) => ({
        id: article.id,
        title: article.title,
        createdAt: article.createdAt,
        category: article.category,
        status: article.status,
        totalViews: article.dailyAnalytics.reduce(
          (sum, analytics) => sum + analytics.viewCount,
          0
        ),
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);

    return articlesWithViews;
  }
}

export default new AnalyticsService();
