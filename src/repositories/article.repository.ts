import { Article, ArticleStatus } from '@/types';
import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { ArticleFiltersInput, CreateArticleInput, UpdateArticleInput } from '@/validators/article.validator';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export class ArticleRepository {
  /**
   * Create a new article
   * Requirements: 3.4, 3.5
   */
  async create(authorId: string, data: CreateArticleInput): Promise<Article> {
    return prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        status: data.status || ArticleStatus.Draft,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing article
   * Requirements: 3.6
   */
  async update(articleId: string, data: UpdateArticleInput): Promise<Article> {
    return prisma.article.update({
      where: { id: articleId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete an article
   * Sets deletedAt timestamp instead of removing from database
   * Requirements: 4.1
   */
  async softDelete(articleId: string): Promise<Article> {
    return prisma.article.update({
      where: { id: articleId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Find article by ID
   * Optionally include deleted articles
   * Requirements: 4.4, 6.1
   */
  async findById(articleId: string, includeDeleted: boolean = false): Promise<Article | null> {
    const where: Prisma.ArticleWhereInput = {
      id: articleId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return prisma.article.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find articles with filters and pagination
   * For public article feed
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
   */
  async findPublicArticles(filters: ArticleFiltersInput): Promise<PaginatedResult<Article>> {
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.Published,
      deletedAt: null,
    };

    // Category filter (exact match)
    if (filters.category) {
      where.category = filters.category;
    }

    // Author filter (partial name match)
    if (filters.author) {
      where.author = {
        name: {
          contains: filters.author,
          mode: 'insensitive',
        },
      };
    }

    // Keyword search in title
    if (filters.q) {
      where.title = {
        contains: filters.q,
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Calculate pagination
    const skip = (filters.page - 1) * filters.size;
    const totalPages = Math.ceil(total / filters.size);

    // Fetch articles
    const data = await prisma.article.findMany({
      where,
      skip,
      take: filters.size,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      data,
      pagination: {
        page: filters.page,
        size: filters.size,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find articles by author
   * Includes both Draft and Published status
   * Optionally includes soft-deleted articles
   * Requirements: 3.8, 4.5
   */
  async findByAuthor(
    authorId: string,
    filters: ArticleFiltersInput
  ): Promise<PaginatedResult<Article>> {
    const where: Prisma.ArticleWhereInput = {
      authorId,
    };

    // Include or exclude deleted articles based on filter
    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Keyword search in title
    if (filters.q) {
      where.title = {
        contains: filters.q,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.article.count({ where });

    // Calculate pagination
    const skip = (filters.page - 1) * filters.size;
    const totalPages = Math.ceil(total / filters.size);

    // Fetch articles
    const data = await prisma.article.findMany({
      where,
      skip,
      take: filters.size,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      data,
      pagination: {
        page: filters.page,
        size: filters.size,
        total,
        totalPages,
      },
    };
  }

  /**
   * Check if article exists and belongs to author
   * Used for authorization checks
   * Requirements: 3.6, 4.2
   */
  async isOwner(articleId: string, authorId: string): Promise<boolean> {
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        authorId,
      },
      select: {
        id: true,
      },
    });

    return article !== null;
  }

  /**
   * Get article with author information
   * Used for detailed article views
   */
  async findByIdWithAuthor(articleId: string): Promise<Article | null> {
    return prisma.article.findFirst({
      where: {
        id: articleId,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
  }
}

export default new ArticleRepository();
