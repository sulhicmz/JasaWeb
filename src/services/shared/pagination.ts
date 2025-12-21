/**
 * Pagination Service
 * Centralized pagination logic for all API endpoints
 * Eliminates duplicate pagination code across 20+ endpoints
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationResult<T = unknown> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  allowedSortFields?: string[];
}

export interface QueryOptions extends PaginationOptions, SortOptions {
  search?: string;
  filters?: Record<string, unknown>;
}

class PaginationService {
  private readonly defaultMaxLimit = 100;

  /**
   * Parse pagination parameters from URL search params
   */
  public parsePagination(url: URL, options: PaginationOptions = {}): PaginationParams {
    const {
      page = 1,
      limit = 10,
      maxLimit = this.defaultMaxLimit,
      defaultLimit = 10
    } = options;

    // Parse and validate page
    const parsedPage = Math.max(1, parseInt(url.searchParams.get('page') || page.toString()));

    // Parse and validate limit
    let parsedLimit = parseInt(url.searchParams.get('limit') || limit.toString());
    
    // Apply default limit if invalid
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      parsedLimit = defaultLimit || 10;
    }
    
    // Apply max limit
    parsedLimit = Math.min(parsedLimit, maxLimit || this.defaultMaxLimit);

    const skip = (parsedPage - 1) * parsedLimit;

    return {
      page: parsedPage,
      limit: parsedLimit,
      skip
    };
  }

  /**
   * Parse sorting parameters from URL search params
   */
  public parseSort(url: URL, options: SortOptions = {}): SortOptions {
    const {
      sortBy,
      sortOrder = 'desc',
      defaultSortBy = 'createdAt',
      defaultSortOrder = 'desc',
      allowedSortFields = []
    } = options;

    const parsedSortBy = url.searchParams.get('sortBy') || sortBy || defaultSortBy;
    const parsedSortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || sortOrder || defaultSortOrder;

    // Validate sort field if allowed fields are specified
    if (allowedSortFields.length > 0 && !allowedSortFields.includes(parsedSortBy)) {
      return {
        sortBy: defaultSortBy,
        sortOrder: defaultSortOrder
      };
    }

    // Validate sort order
    if (!['asc', 'desc'].includes(parsedSortOrder)) {
      return {
        sortBy: parsedSortBy,
        sortOrder: defaultSortOrder
      };
    }

    return {
      sortBy: parsedSortBy,
      sortOrder: parsedSortOrder
    };
  }

  /**
   * Parse all query parameters (pagination, sorting, search, filters)
   */
  public parseQuery(url: URL, options: QueryOptions = {}): {
    pagination: PaginationParams;
    sort: SortOptions;
    search?: string;
    filters: Record<string, unknown>;
  } {
    const pagination = this.parsePagination(url, options);
    const sort = this.parseSort(url, options);
    const search = url.searchParams.get('search') || options.search || undefined;

    // Parse filters
    const filters: Record<string, unknown> = { ...options.filters };
    
    // Common filter patterns
    const commonFilters = ['status', 'category', 'role', 'type'];
    commonFilters.forEach(filter => {
      const value = url.searchParams.get(filter);
      if (value !== null) {
        filters[filter] = value;
      }
    });

    return {
      pagination,
      sort,
      search: search || undefined,
      filters
    };
  }

  /**
   * Create pagination metadata
   */
  public createMetadata(total: number, pagination: PaginationParams): PaginationMetadata {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Create paginated response
   */
  public createResponse<T>(
    data: T[],
    total: number,
    pagination: PaginationParams
  ): PaginationResult<T> {
    return {
      data,
      pagination: this.createMetadata(total, pagination)
    };
  }

  /**
   * Generate Prisma query object with pagination and sorting
   */
  public createPrismaQuery(
    pagination: PaginationParams,
    sort: SortOptions,
    additionalWhere: Record<string, unknown> = {}
  ) {
    const { skip, limit } = pagination;
    const { sortBy, sortOrder } = sort;

    return {
      where: additionalWhere,
      orderBy: {
        [sortBy as string]: sortOrder
      },
      skip,
      take: limit
    };
  }

  /**
   * Add search condition to Prisma where clause
   */
  public addSearchCondition(
    where: Record<string, unknown>,
    search: string,
    searchableFields: string[]
  ): Record<string, unknown> {
    if (!search || searchableFields.length === 0) {
      return where;
    }

    const searchConditions = searchableFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const
      }
    }));

    return {
      ...where,
      OR: searchConditions
    };
  }

  /**
   * Validate pagination parameters
   */
  public validatePagination(params: PaginationParams): {
    isValid: boolean;
    error?: string;
  } {
    if (params.page < 1) {
      return { isValid: false, error: 'Page must be greater than 0' };
    }

    if (params.limit < 1 || params.limit > this.defaultMaxLimit) {
      return { 
        isValid: false, 
        error: `Limit must be between 1 and ${this.defaultMaxLimit}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Get pagination links for API responses
   */
  public getLinks(
    baseUrl: string,
    pagination: PaginationParams,
    totalPages: number
  ): {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  } {
    const { page, limit } = pagination;
    const links: Record<string, string | undefined> = {};

    // First page
    if (page > 1) {
      links.first = `${baseUrl}?page=1&limit=${limit}`;
    }

    // Previous page
    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    }

    // Next page
    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    }

    // Last page
    if (page < totalPages) {
      links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
    }

    return links;
  }
}

// Singleton instance
export const paginationService = new PaginationService();

// Convenience exports
export const parsePagination = paginationService.parsePagination.bind(paginationService);
export const parseSort = paginationService.parseSort.bind(paginationService);
export const parseQuery = paginationService.parseQuery.bind(paginationService);
export const createResponse = paginationService.createResponse.bind(paginationService);
export const createPrismaQuery = paginationService.createPrismaQuery.bind(paginationService);
export const addSearchCondition = paginationService.addSearchCondition.bind(paginationService);