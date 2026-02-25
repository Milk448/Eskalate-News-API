import { Request } from 'express';
import { ArticleStatus as PrismaArticleStatus, Role as PrismaRole } from '@prisma/client';

// Re-export Prisma enums
export const Role = PrismaRole;
export type Role = PrismaRole;

export const ArticleStatus = PrismaArticleStatus;
export type ArticleStatus = PrismaArticleStatus;

// Article type
export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  status: ArticleStatus;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

export interface PaginatedResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T[];
  PageNumber: number;
  PageSize: number;
  TotalSize: number;
  Errors: null;
}

// JWT Payload
export interface JwtPayload {
  sub: string; // userId
  role: Role;
  iat?: number;
  exp?: number;
}

// Extended Express Request with user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Pagination
export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

// Article Filters
export interface ArticleFilters {
  category?: string;
  author?: string;
  q?: string;
  status?: 'Draft' | 'Published';
  includeDeleted?: boolean;
}

// Dashboard Item
export interface DashboardItem {
  id: string;
  title: string;
  createdAt: Date;
  totalViews: number;
}

// Custom Error
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: string[] = []
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
