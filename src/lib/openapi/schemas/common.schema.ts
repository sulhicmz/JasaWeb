import type { OpenAPIV3 } from 'openapi-types';

export interface ApiResponseData {
  success: boolean;
  data: unknown;
  error: string | null;
  message: string | null;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponseData {
  success: boolean;
  data: unknown[];
  pagination: PaginationData;
}

export interface ErrorResponseData {
  success: false;
  error: string;
  message?: string | null;
}

export const apiResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'object', nullable: true },
    error: { type: 'string', nullable: true, example: null },
    message: { type: 'string', nullable: true, example: 'Operation successful' }
  }
};

export const paginatedResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'array', items: { type: 'object' } },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 10 },
        total: { type: 'integer', example: 150 },
        totalPages: { type: 'integer', example: 15 }
      }
    }
  }
};

export const errorResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: { type: 'string', example: 'Validation failed' },
    message: { type: 'string', nullable: true }
  },
  required: ['success', 'error']
};

export function isApiResponse(data: unknown): data is ApiResponseData {
  return typeof data === 'object' && data !== null &&
    'success' in data &&
    typeof (data as ApiResponseData).success === 'boolean';
}

export function isErrorResponse(data: unknown): data is ErrorResponseData {
  return isApiResponse(data) && (data as ApiResponseData).success === false &&
    'error' in data;
}

export function isPaginatedResponse(data: unknown): data is PaginatedResponseData {
  return typeof data === 'object' && data !== null &&
    'success' in data &&
    'pagination' in data &&
    Array.isArray((data as PaginatedResponseData).data);
}
