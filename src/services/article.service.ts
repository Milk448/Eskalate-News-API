import { Article } from '@/types';
import articleRepository, { PaginatedResult } from '@/repositories/article.repository';
import { AppError } from '@/types';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleFiltersInput,
} from '@/validators/article.validator';

export class ArticleService {
  /**
   * Create a new article
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async create(authorId: string, data: CreateArticleInput): Promise<Article> {
    return articleRepository.create(authorId, data);
  }

  /**
   * Update an existing article
   * Verifies ownership before updating
   * Requirements: 3.6, 3.7
   */
  async update(articleId: string, authorId: string, data: UpdateArticleInput): Promise<Article> {
    // Check if article exists and belongs to author
    const isOwner = await articleRepository.isOwner(articleId, authorId);

    if (!isOwner) {
      throw new AppError(403, 'Forbidden', [
        'You do not have permission to modify this article',
      ]);
    }

    try {
      return await articleRepository.update(articleId, data);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(404, 'Article not found', ['The requested article does not exist']);
      }
      throw error;
    }
  }

  /**
   * Soft delete an article
   * Verifies ownership before deleting
   * Requirements: 4.1, 4.2, 4.3
   */
  async delete(articleId: string, authorId: string): Promise<void> {
    // Check if article exists and belongs to author
    const isOwner = await articleRepository.isOwner(articleId, authorId);

    if (!isOwner) {
      throw new AppError(403, 'Forbidden', [
        'You do not have permission to delete this article',
      ]);
    }

    try {
      await articleRepository.softDelete(articleId);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(404, 'Article not found', ['The requested article does not exist']);
      }
      throw error;
    }
  }

  /**
   * Get article by ID
   * Returns null if article is deleted
   * Requirements: 6.1, 6.2
   */
  async getById(articleId: string): Promise<Article> {
    const article = await articleRepository.findById(articleId, false);

    if (!article) {
      throw new AppError(404, 'News article no longer available', [
        'The requested article has been deleted or does not exist',
      ]);
    }

    return article;
  }

  /**
   * Get public articles with filters
   * Only returns published, non-deleted articles
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
   */
  async getPublicArticles(filters: ArticleFiltersInput): Promise<PaginatedResult<Article>> {
    return articleRepository.findPublicArticles(filters);
  }

  /**
   * Get articles by author
   * Includes both Draft and Published status
   * Optionally includes soft-deleted articles
   * Requirements: 3.8, 4.5
   */
  async getAuthorArticles(
    authorId: string,
    filters: ArticleFiltersInput
  ): Promise<PaginatedResult<Article>> {
    return articleRepository.findByAuthor(authorId, filters);
  }

  /**
   * Get article with full details including author
   * Used for detailed article views
   */
  async getByIdWithAuthor(articleId: string): Promise<Article> {
    const article = await articleRepository.findByIdWithAuthor(articleId);

    if (!article) {
      throw new AppError(404, 'News article no longer available', [
        'The requested article has been deleted or does not exist',
      ]);
    }

    return article;
  }

  /**
   * Check if user is the owner of an article
   * Used for authorization checks
   */
  async isOwner(articleId: string, authorId: string): Promise<boolean> {
    return articleRepository.isOwner(articleId, authorId);
  }
}

export default new ArticleService();
