/**
 * Common types for JasaWeb monorepo
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Common status types
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

// Priority types
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// File types
export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}