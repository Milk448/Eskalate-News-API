import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginatedResult } from '@/types';

/**
 * Send a successful API response
 */
export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    Success: true,
    Message: message,
    Object: data,
    Errors: null,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send an error API response
 */
export function sendError(
  res: Response,
  message: string,
  errors: string[] = [],
  statusCode: number = 400
): Response {
  const response: ApiResponse = {
    Success: false,
    Message: message,
    Object: null,
    Errors: errors.length > 0 ? errors : null,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a paginated API response
 */
export function sendPaginated<T>(
  res: Response,
  message: string,
  result: PaginatedResult<T>,
  statusCode: number = 200
): Response {
  const response: PaginatedResponse<T> = {
    Success: true,
    Message: message,
    Object: result.data,
    PageNumber: result.page,
    PageSize: result.size,
    TotalSize: result.total,
    Errors: null,
  };
  return res.status(statusCode).json(response);
}

/**
 * Create a success response object (for testing)
 */
export function createSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    Success: true,
    Message: message,
    Object: data,
    Errors: null,
  };
}

/**
 * Create an error response object (for testing)
 */
export function createErrorResponse(message: string, errors: string[] = []): ApiResponse {
  return {
    Success: false,
    Message: message,
    Object: null,
    Errors: errors.length > 0 ? errors : null,
  };
}

/**
 * Create a paginated response object (for testing)
 */
export function createPaginatedResponse<T>(
  message: string,
  result: PaginatedResult<T>
): PaginatedResponse<T> {
  return {
    Success: true,
    Message: message,
    Object: result.data,
    PageNumber: result.page,
    PageSize: result.size,
    TotalSize: result.total,
    Errors: null,
  };
}
