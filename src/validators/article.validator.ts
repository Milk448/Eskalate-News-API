import { z } from 'zod';
import { ArticleStatus } from '@/types';

/**
 * Article Creation Schema
 * Requirements: 3.1, 3.2, 3.3
 * - Title: 1-150 characters
 * - Content: minimum 50 characters
 * - Category: required
 * - Status: optional (defaults to Draft)
 */
export const createArticleSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
    })
    .min(1, 'Title must be at least 1 character')
    .max(150, 'Title must not exceed 150 characters')
    .trim(),
  
  content: z
    .string({
      required_error: 'Content is required',
    })
    .min(50, 'Content must be at least 50 characters')
    .trim(),
  
  category: z
    .string({
      required_error: 'Category is required',
    })
    .min(1, 'Category cannot be empty')
    .trim(),
  
  status: z
    .nativeEnum(ArticleStatus, {
      errorMap: () => ({ message: 'Status must be either Draft or Published' }),
    })
    .optional()
    .default(ArticleStatus.Draft),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;

/**
 * Article Update Schema
 * All fields are optional for partial updates
 */
export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must be at least 1 character')
    .max(150, 'Title must not exceed 150 characters')
    .trim()
    .optional(),
  
  content: z
    .string()
    .min(50, 'Content must be at least 50 characters')
    .trim()
    .optional(),
  
  category: z
    .string()
    .min(1, 'Category cannot be empty')
    .trim()
    .optional(),
  
  status: z
    .nativeEnum(ArticleStatus, {
      errorMap: () => ({ message: 'Status must be either Draft or Published' }),
    })
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

/**
 * Article Filters Schema
 * Requirements: 5.2, 5.3, 5.4, 5.5
 * - category: exact match filter
 * - author: partial name match filter
 * - q: keyword search in title
 * - page: pagination page number (default 1)
 * - size: pagination page size (default 10, max 100)
 * - includeDeleted: whether to include soft-deleted articles (author only)
 */
export const articleFiltersSchema = z.object({
  category: z
    .string()
    .trim()
    .optional(),
  
  author: z
    .string()
    .trim()
    .optional(),
  
  q: z
    .string()
    .trim()
    .optional(),
  
  page: z
    .coerce
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  
  size: z
    .coerce
    .number()
    .int('Size must be an integer')
    .positive('Size must be positive')
    .max(100, 'Size must not exceed 100')
    .default(10),
  
  includeDeleted: z
    .coerce
    .boolean()
    .optional()
    .default(false),
});

export type ArticleFiltersInput = z.infer<typeof articleFiltersSchema>;

/**
 * Article ID Parameter Schema
 * For validating UUID parameters in routes
 */
export const articleIdSchema = z.object({
  id: z
    .string()
    .uuid('Invalid article ID format'),
});

export type ArticleIdInput = z.infer<typeof articleIdSchema>;
