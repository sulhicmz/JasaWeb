/**
 * Pagination Service Tests
 * Comprehensive test coverage for the pagination service
 */

import { describe, it, expect } from 'vitest';
import { 
  paginationService, 
  parsePagination, 
  parseQuery, 
  createResponse,
  parseSort 
} from './pagination';

describe('PaginationService', () => {
  describe('parsePagination', () => {
    it('should parse default pagination parameters', () => {
      const url = new URL('https://example.com/api/data');
      const result = parsePagination(url);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        skip: 0
      });
    });

    it('should parse custom pagination parameters', () => {
      const url = new URL('https://example.com/api/data?page=3&limit=20');
      const result = parsePagination(url);

      expect(result).toEqual({
        page: 3,
        limit: 20,
        skip: 40
      });
    });

    it('should respect max limit', () => {
      const url = new URL('https://example.com/api/data?limit=200');
      const result = parsePagination(url, { maxLimit: 50 });

      expect(result.limit).toBe(50);
    });

    it('should handle invalid page gracefully', () => {
      const url = new URL('https://example.com/api/data?page=-1');
      const result = parsePagination(url);

      expect(result.page).toBe(1);
    });

    it('should handle invalid limit gracefully', () => {
      const url = new URL('https://example.com/api/data?limit=0');
      const result = parsePagination(url, { defaultLimit: 10 });

      expect(result.limit).toBe(10);
    });
  });

  describe('parseSort', () => {
    it('should parse default sort parameters', () => {
      const url = new URL('https://example.com/api/data');
      const result = parseSort(url);

      expect(result).toEqual({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should parse custom sort parameters', () => {
      const url = new URL('https://example.com/api/data?sortBy=name&sortOrder=asc');
      const result = parseSort(url);

      expect(result).toEqual({
        sortBy: 'name',
        sortOrder: 'asc' as const
      });
    });

    it('should validate allowed sort fields', () => {
      const url = new URL('https://example.com/api/data?sortBy=invalid');
      const result = parseSort(url, {
        allowedSortFields: ['name', 'createdAt'],
        defaultSortBy: 'createdAt'
      });

      expect(result.sortBy).toBe('createdAt');
    });

    it('should validate sort order', () => {
      const url = new URL('https://example.com/api/data?sortOrder=invalid');
      const result = parseSort(url);

      expect(result.sortOrder).toBe('desc');
    });
  });

  describe('parseQuery', () => {
    it('should parse complete query parameters', () => {
      const url = new URL('https://example.com/api/data?page=2&limit=5&sortBy=name&sortOrder=asc&search=test&status=active');
      const result = parseQuery(url);

      expect(result).toEqual({
        pagination: {
          page: 2,
          limit: 5,
          skip: 5
        },
        sort: {
          sortBy: 'name',
          sortOrder: 'asc'
        },
        search: 'test',
        filters: {
          status: 'active'
        }
      });
    });

    it('should handle empty query parameters', () => {
      const url = new URL('https://example.com/api/data');
      const result = parseQuery(url);

      expect(result.pagination.page).toBe(1);
      expect(result.sort.sortBy).toBe('createdAt');
      expect(result.search).toBeUndefined();
      expect(result.filters).toEqual({});
    });
  });

  describe('createResponse', () => {
    it('should create paginated response with metadata', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const total = 25;
      const pagination = { page: 2, limit: 10, skip: 10 };

      const result = createResponse(data, total, pagination);

      expect(result).toEqual({
        data,
        pagination: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrev: true
        }
      });
    });

    it('should handle first page correctly', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 15;
      const pagination = { page: 1, limit: 10, skip: 0 };

      const result = createResponse(data, total, pagination);

      expect(result.pagination.hasPrev).toBe(false);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should handle last page correctly', () => {
      const data = [{ id: 1 }];
      const total = 21;
      const pagination = { page: 3, limit: 10, skip: 20 };

      const result = createResponse(data, total, pagination);

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe('addSearchCondition', () => {
    it('should add search condition to where clause', () => {
      const where = { status: 'active' };
      const search = 'test';
      const searchableFields = ['name', 'email'];

      const result = paginationService.addSearchCondition(where, search, searchableFields);

      expect(result).toEqual({
        status: 'active',
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { email: { contains: 'test', mode: 'insensitive' } }
        ]
      });
    });

    it('should return original where clause if no search', () => {
      const where = { status: 'active' };
      const search = '';
      const searchableFields = ['name', 'email'];

      const result = paginationService.addSearchCondition(where, search, searchableFields);

      expect(result).toEqual(where);
    });
  });

  describe('createPrismaQuery', () => {
    it('should create complete Prisma query', () => {
      const pagination = { page: 2, limit: 10, skip: 10 };
      const sort = { sortBy: 'name', sortOrder: 'asc' as const };
      const additionalWhere = { status: 'active' };

      const result = paginationService.createPrismaQuery(pagination, sort, additionalWhere);

      expect(result).toEqual({
        where: { status: 'active' },
        orderBy: { name: 'asc' },
        skip: 10,
        take: 10
      });
    });
  });

  describe('validatePagination', () => {
    it('should validate correct pagination', () => {
      const pagination = { page: 1, limit: 10, skip: 0 };

      const result = paginationService.validatePagination(pagination);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid page', () => {
      const pagination = { page: -1, limit: 10, skip: -10 };

      const result = paginationService.validatePagination(pagination);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Page must be greater than 0');
    });

    it('should reject invalid limit', () => {
      const pagination = { page: 1, limit: 200, skip: 0 };

      const result = paginationService.validatePagination(pagination);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Limit must be between 1 and');
    });
  });

  describe('getLinks', () => {
    it('should generate pagination links for middle page', () => {
      const baseUrl = 'https://example.com/api/data';
      const pagination = { page: 2, limit: 10, skip: 10 };
      const totalPages = 5;

      const result = paginationService.getLinks(baseUrl, pagination, totalPages);

      expect(result).toEqual({
        first: 'https://example.com/api/data?page=1&limit=10',
        prev: 'https://example.com/api/data?page=1&limit=10',
        next: 'https://example.com/api/data?page=3&limit=10',
        last: 'https://example.com/api/data?page=5&limit=10'
      });
    });

    it('should generate links for first page', () => {
      const baseUrl = 'https://example.com/api/data';
      const pagination = { page: 1, limit: 10, skip: 0 };
      const totalPages = 3;

      const result = paginationService.getLinks(baseUrl, pagination, totalPages);

      expect(result.first).toBeUndefined();
      expect(result.prev).toBeUndefined();
      expect(result.next).toBe('https://example.com/api/data?page=2&limit=10');
      expect(result.last).toBe('https://example.com/api/data?page=3&limit=10');
    });
  });
});