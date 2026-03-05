import * as fc from 'fast-check';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from '@/utils/response';
import { PaginatedResult } from '@/types';

/**
 * Feature: news-api, Property 25: Response Format Consistency
 * Validates: Requirements 10.1, 10.2, 10.3
 *
 * For any API response, it should follow the standard format with Success (boolean),
 * Message (string), Object (data or null), and Errors (array or null), with paginated
 * responses additionally including PageNumber, PageSize, and TotalSize
 */
describe('Feature: news-api, Property 25: Response Format Consistency', () => {
  it('should maintain consistent success response format for any data', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.anything(),
        (message, data) => {
          const response = createSuccessResponse(message, data);

          // Verify structure
          expect(response).toHaveProperty('Success');
          expect(response).toHaveProperty('Message');
          expect(response).toHaveProperty('Object');
          expect(response).toHaveProperty('Errors');

          // Verify types and values
          expect(typeof response.Success).toBe('boolean');
          expect(response.Success).toBe(true);
          expect(typeof response.Message).toBe('string');
          expect(response.Message).toBe(message);
          expect(response.Object).toBe(data);
          expect(response.Errors).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent error response format for any message and errors', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.string()),
        (message, errors) => {
          const response = createErrorResponse(message, errors);

          // Verify structure
          expect(response).toHaveProperty('Success');
          expect(response).toHaveProperty('Message');
          expect(response).toHaveProperty('Object');
          expect(response).toHaveProperty('Errors');

          // Verify types and values
          expect(typeof response.Success).toBe('boolean');
          expect(response.Success).toBe(false);
          expect(typeof response.Message).toBe('string');
          expect(response.Message).toBe(message);
          expect(response.Object).toBeNull();

          // Errors should be null if empty array, otherwise the array
          if (errors.length === 0) {
            expect(response.Errors).toBeNull();
          } else {
            expect(Array.isArray(response.Errors)).toBe(true);
            expect(response.Errors).toEqual(errors);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent paginated response format for any data', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.anything()),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (message, data, page, size, total) => {
          const result: PaginatedResult<any> = {
            data,
            page,
            size,
            total,
          };

          const response = createPaginatedResponse(message, result);

          // Verify base structure
          expect(response).toHaveProperty('Success');
          expect(response).toHaveProperty('Message');
          expect(response).toHaveProperty('Object');
          expect(response).toHaveProperty('Errors');

          // Verify pagination-specific fields
          expect(response).toHaveProperty('PageNumber');
          expect(response).toHaveProperty('PageSize');
          expect(response).toHaveProperty('TotalSize');

          // Verify types and values
          expect(response.Success).toBe(true);
          expect(response.Message).toBe(message);
          expect(response.Object).toEqual(data);
          expect(response.Errors).toBeNull();
          expect(response.PageNumber).toBe(page);
          expect(response.PageSize).toBe(size);
          expect(response.TotalSize).toBe(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure all response types have exactly the required fields', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.anything(),
        (message, data) => {
          const successResponse = createSuccessResponse(message, data);
          const errorResponse = createErrorResponse(message, []);

          // Success response should have exactly 4 fields
          expect(Object.keys(successResponse)).toHaveLength(4);
          expect(Object.keys(successResponse).sort()).toEqual(['Errors', 'Message', 'Object', 'Success'].sort());

          // Error response should have exactly 4 fields
          expect(Object.keys(errorResponse)).toHaveLength(4);
          expect(Object.keys(errorResponse).sort()).toEqual(['Errors', 'Message', 'Object', 'Success'].sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure paginated responses have exactly 7 fields', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.anything()),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (message, data, page, size, total) => {
          const result: PaginatedResult<any> = { data, page, size, total };
          const response = createPaginatedResponse(message, result);

          // Paginated response should have exactly 7 fields
          expect(Object.keys(response)).toHaveLength(7);
          expect(Object.keys(response).sort()).toEqual(
            ['Errors', 'Message', 'Object', 'PageNumber', 'PageSize', 'Success', 'TotalSize'].sort()
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
