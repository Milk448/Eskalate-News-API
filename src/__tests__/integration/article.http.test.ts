import request from 'supertest';
import { createApp } from '@/app';
import { Application } from 'express';
import { Role, ArticleStatus } from '@/types';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

// Mock dependencies
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    article: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    dailyAnalytics: {
      findMany: jest.fn(),
    },
    $use: jest.fn(),
  },
}));

jest.mock('@/services/readLog.service', () => ({
  __esModule: true,
  default: {
    recordRead: jest.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '@/config/database';

describe('Article HTTP Endpoints', () => {
  let app: Application;
  let authorToken: string;
  let readerToken: string;

  beforeAll(() => {
    app = createApp();
    
    // Generate test tokens
    authorToken = jwt.sign(
      { sub: 'author-123', role: Role.author },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    readerToken = jwt.sign(
      { sub: 'reader-123', role: Role.reader },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /articles - Public Articles', () => {
    it('should return paginated published articles', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article 1',
          content: 'Content 1',
          category: 'Tech',
          status: ArticleStatus.Published,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: {
            id: 'author-123',
            name: 'John Doe',
            email: 'john@example.com',
            role: Role.author,
          },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles as any);

      const response = await request(app)
        .get('/articles')
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect(response.body.Object).toHaveLength(1);
      expect(response.body.PageNumber).toBe(1);
      expect(response.body.PageSize).toBe(10);
      expect(response.body.TotalSize).toBe(1);
    });

    it('should filter articles by category', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/articles?category=Tech')
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect((prisma.article.findMany as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Tech',
          }),
        })
      );
    });

    it('should filter articles by author name', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/articles?author=John')
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect((prisma.article.findMany as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            author: expect.objectContaining({
              name: expect.objectContaining({
                contains: 'John',
              }),
            }),
          }),
        })
      );
    });

    it('should search articles by keyword', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/articles?q=typescript')
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect((prisma.article.findMany as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({
              contains: 'typescript',
            }),
          }),
        })
      );
    });

    it('should support pagination', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(25);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/articles?page=2&size=5')
        .expect(200);

      expect(response.body.PageNumber).toBe(2);
      expect(response.body.PageSize).toBe(5);
      expect((prisma.article.findMany as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('GET /articles/:id - Get Article by ID', () => {
    it('should return article when it exists', async () => {
      const articleId = '550e8400-e29b-41d4-a716-446655440000';
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        content: 'Test Content',
        category: 'Tech',
        status: ArticleStatus.Published,
        authorId: 'author-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'author-123',
          name: 'John Doe',
          email: 'john@example.com',
          role: Role.author,
          createdAt: new Date(),
        },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockArticle as any);

      const response = await request(app)
        .get(`/articles/${articleId}`)
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect(response.body.Object.id).toBe(articleId);
      expect(response.body.Object.title).toBe('Test Article');
    });

    it('should return 404 when article does not exist', async () => {
      const nonexistentId = '550e8400-e29b-41d4-a716-446655440001';
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/articles/${nonexistentId}`)
        .expect(404);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('no longer available');
    });

    it('should return 404 for deleted articles', async () => {
      const articleId = '550e8400-e29b-41d4-a716-446655440002';
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/articles/${articleId}`)
        .expect(404);

      expect(response.body.Success).toBe(false);
    });
  });

  describe('POST /articles - Create Article (Author Only)', () => {
    it('should create article with valid data and author token', async () => {
      const newArticle = {
        id: 'new-article-123',
        title: 'New Article',
        content: 'This is a new article with more than 50 characters of content.',
        category: 'Tech',
        status: ArticleStatus.Published,
        authorId: 'author-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'author-123',
          name: 'John Doe',
          email: 'john@example.com',
          role: Role.author,
        },
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(newArticle as any);

      const response = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'New Article',
          content: 'This is a new article with more than 50 characters of content.',
          category: 'Tech',
          status: 'Published',
        })
        .expect(201);

      expect(response.body.Success).toBe(true);
      expect(response.body.Object.title).toBe('New Article');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/articles')
        .send({
          title: 'New Article',
          content: 'Content',
          category: 'Tech',
        })
        .expect(401);

      expect(response.body.Success).toBe(false);
    });

    it('should return 403 for reader role', async () => {
      const response = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'New Article',
          content: 'This is a new article with more than 50 characters of content.',
          category: 'Tech',
        })
        .expect(403);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('permission');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'A',
          content: 'Too short',
          category: '',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
    });
  });

  describe('GET /articles/me - Get My Articles (Author Only)', () => {
    it('should return author\'s articles', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'My Article',
          content: 'Content',
          category: 'Tech',
          status: ArticleStatus.Draft,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: {
            id: 'author-123',
            name: 'John Doe',
            email: 'john@example.com',
            role: Role.author,
          },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles as any);

      const response = await request(app)
        .get('/articles/me')
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect(response.body.Object).toHaveLength(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/articles/me')
        .expect(401);

      expect(response.body.Success).toBe(false);
    });

    it('should return 403 for reader role', async () => {
      const response = await request(app)
        .get('/articles/me')
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(403);

      expect(response.body.Success).toBe(false);
    });
  });

  describe('PUT /articles/:id - Update Article (Author Only)', () => {
    it('should update article when owner', async () => {
      const articleId = '550e8400-e29b-41d4-a716-446655440003';
      const existingArticle = {
        id: articleId,
        authorId: 'author-123',
      };

      const updatedArticle = {
        id: articleId,
        title: 'Updated Title',
        content: 'Updated content with more than 50 characters for validation.',
        category: 'Tech',
        status: ArticleStatus.Published,
        authorId: 'author-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: {
          id: 'author-123',
          name: 'John Doe',
          email: 'john@example.com',
          role: Role.author,
        },
      };

      // Mock for isOwner check
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(existingArticle as any);
      // Mock for update
      (prisma.article.update as jest.Mock).mockResolvedValueOnce(updatedArticle as any);

      const response = await request(app)
        .put(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect(response.body.Object.title).toBe('Updated Title');
    });

    it('should return 403 when not owner', async () => {
      const articleId = '550e8400-e29b-41d4-a716-446655440004';
      
      // Mock for isOwner check - returns null because authorId doesn't match
      // (Prisma would return null when where clause doesn't match)
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .put(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(403);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('Forbidden');
    });

    it('should return 403 for nonexistent article', async () => {
      const nonexistentId = '550e8400-e29b-41d4-a716-446655440005';
      // Mock for isOwner check returns null (article doesn't exist)
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .put(`/articles/${nonexistentId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(403);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('Forbidden');
    });
  });

  describe('DELETE /articles/:id - Soft Delete Article (Author Only)', () => {
    it('should soft delete article when owner', async () => {
      const articleId = '550e8400-e29b-41d4-a716-446655440006';
      const existingArticle = {
        id: articleId,
        authorId: 'author-123',
      };

      const deletedArticle = {
        ...existingArticle,
        deletedAt: new Date(),
      };

      // Mock for isOwner check
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(existingArticle as any);
      // Mock for update (soft delete)
      (prisma.article.update as jest.Mock).mockResolvedValueOnce(deletedArticle as any);

      const response = await request(app)
        .delete(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect((prisma.article.update as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: articleId },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should return 403 when not owner', async () => {
      const articleId = '550e8400-e29b-41d4-a716-446655440007';
      
      // Mock for isOwner check - returns null because authorId doesn't match
      // (Prisma would return null when where clause doesn't match)
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .delete(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(403);

      expect(response.body.Success).toBe(false);
    });
  });

  describe('GET /author/dashboard - Author Dashboard', () => {
    it('should return dashboard with view counts', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Article 1',
          createdAt: new Date(),
          dailyAnalytics: [
            { viewCount: 10 },
            { viewCount: 20 },
          ],
        },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles as any);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/author/dashboard')
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect(response.body.Object[0].totalViews).toBe(30);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/author/dashboard')
        .expect(401);

      expect(response.body.Success).toBe(false);
    });

    it('should return 403 for reader role', async () => {
      const response = await request(app)
        .get('/author/dashboard')
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(403);

      expect(response.body.Success).toBe(false);
    });
  });
});
