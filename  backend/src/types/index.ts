/**
 * Shared Type Definitions
 *
 * Central module that re-exports Prisma-generated enums and declares all
 * application-wide TypeScript interfaces and utility classes.
 *
 * Keeping types in one place avoids circular imports between layers
 * (controllers, services, repositories) and gives every collaborator a single
 * source of truth for the API's data contracts.
 */
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

/** Standard envelope returned by every non-paginated API endpoint. */
export interface ApiResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

/** Envelope returned by list endpoints that support pagination. */
export interface PaginatedResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T[];
  PageNumber: number;
  PageSize: number;
  TotalSize: number;
  Errors: null;
}

/**
 * Claims stored inside a signed JWT.
 * `sub` holds the user's UUID; `role` drives RBAC decisions.
 */
export interface JwtPayload {
  sub: string; // userId
  role: Role;
  iat?: number;
  exp?: number;
}

/**
 * Express Request extended with the decoded JWT payload.
 * Populated by the `authenticate` / `optionalAuth` middleware.
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Pagination query parameters accepted by list endpoints. */
export interface PaginationParams {
  page: number;
  size: number;
}

/** Paginated result wrapper returned by repository / service methods. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

/** Query-string filters accepted by the public article listing endpoint. */
export interface ArticleFilters {
  category?: string;
  author?: string;
  q?: string;
  status?: 'Draft' | 'Published';
  includeDeleted?: boolean;
}

/** A single row in the author analytics dashboard, including aggregated view counts. */
export interface DashboardItem {
  id: string;
  title: string;
  createdAt: Date;
  totalViews: number;
}

/**
 * Custom application error.
 *
 * Thrown anywhere in the service/controller layers to signal a known,
 * user-facing error condition.  The global `errorHandler` middleware catches
 * these and serialises them into the standard `ApiResponse` envelope with the
 * appropriate HTTP status code.
 */
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
