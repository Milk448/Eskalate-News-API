import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { errorHandler } from '../errorHandler';
import { AppError } from '../../types';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      path: '/test',
      method: 'GET',
    };

    mockResponse = {
      status: statusMock,
    };

    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle AppError with correct status code and message', () => {
      const error = new AppError(400, 'Bad request', ['Invalid input']);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Bad request',
        Object: null,
        Errors: ['Invalid input'],
      });
    });

    it('should handle AppError without errors array', () => {
      const error = new AppError(404, 'Not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Not found',
        Object: null,
        Errors: null,
      });
    });
  });

  describe('Zod validation error handling', () => {
    it('should format Zod errors correctly', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid', age: 10 });
      } catch (error) {
        errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            Success: false,
            Message: 'Validation failed',
            Object: null,
            Errors: expect.arrayContaining([
              expect.stringContaining('email'),
              expect.stringContaining('age'),
            ]),
          })
        );
      }
    });
  });

  describe('Prisma error handling', () => {
    it('should handle P2002 unique constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Resource already exists',
        Object: null,
        Errors: ['Duplicate entry for email'],
      });
    });

    it('should handle P2025 record not found', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Resource not found',
        Object: null,
        Errors: ['The requested resource does not exist'],
      });
    });

    it('should handle P2003 foreign key constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Invalid reference',
        Object: null,
        Errors: ['Referenced resource does not exist'],
      });
    });

    it('should handle unknown Prisma errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Database operation failed',
        Object: null,
        Errors: null,
      });
    });

    it('should handle Prisma validation errors', () => {
      const error = new Prisma.PrismaClientValidationError('Validation failed', {
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Invalid data provided',
        Object: null,
        Errors: ['Data validation failed'],
      });
    });
  });

  describe('JWT error handling', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Invalid authentication token',
        Object: null,
        Errors: null,
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'Authentication token has expired',
        Object: null,
        Errors: null,
      });
    });
  });

  describe('Stack trace protection', () => {
    it('should not expose stack traces in error responses', () => {
      const error = new Error('Internal error with sensitive info');
      error.stack = 'Error: Internal error\n    at /home/user/secret/path.ts:123:45';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      const response = jsonMock.mock.calls[0][0];

      // Ensure no stack trace in response
      expect(JSON.stringify(response)).not.toContain('Error:');
      expect(JSON.stringify(response)).not.toContain('.ts:');
      expect(JSON.stringify(response)).not.toContain('at ');
    });

    it('should not expose internal error details', () => {
      const error = new Error('Database connection failed at postgresql://user:password@host:5432/db');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      // Ensure no sensitive details in response
      expect(JSON.stringify(response)).not.toContain('postgresql://');
      expect(JSON.stringify(response)).not.toContain('password');
    });
  });

  describe('Default error handling', () => {
    it('should handle unknown errors with generic message', () => {
      const error = new Error('Some unexpected error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        Success: false,
        Message: 'An unexpected error occurred',
        Object: null,
        Errors: null,
      });
    });
  });
});
