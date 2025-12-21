/**
 * Admin Templates List API
 * GET: List templates for admin management
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
  jsonResponse, 
  errorResponse, 
  handleApiError 
} from '@/lib/api';
import { validateAdminAccess } from '@/services/admin/auth';
import { paginationService } from '@/services/shared/pagination';

export const GET: APIRoute = async (context) => {
  try {
    // Authentication and admin validation
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    const prisma = getPrisma(context.locals);
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') as string || undefined;

    // Parse query parameters using centralized pagination service
    const query = paginationService.parseQuery(url, {
      defaultLimit: 12,
      maxLimit: 50,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      allowedSortFields: ['createdAt', 'name', 'category'],
      filters: category ? { category } : undefined
    });

    // Validate pagination parameters
    const validation = paginationService.validatePagination(query.pagination);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    // Validate category if provided
    if (query.filters.category && !['sekolah', 'berita', 'company'].includes(query.filters.category as string)) {
      return errorResponse('Kategori harus "sekolah", "berita", atau "company"');
    }

    // Build where clause with pagination service helpers
    let where: Record<string, unknown> = {};
    if (query.filters.category) {
      where.category = query.filters.category;
    }

    // Add search condition if provided
    if (query.search) {
      where = paginationService.addSearchCondition(
        where, 
        query.search, 
        ['name', 'category']
      );
    }

    // Create Prisma query with pagination and sorting
    const baseQuery = paginationService.createPrismaQuery(
      query.pagination,
      query.sort,
      where
    );

    // Add selective fields for list performance
    const prismaQuery = {
      ...baseQuery,
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        demoUrl: true,
        createdAt: true,
      }
    };

    // Get total count and templates in parallel
    const [total, templates] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.findMany(prismaQuery),
    ]);

    // Create standardized response
    const result = paginationService.createResponse(templates, total, query.pagination);

    return jsonResponse({
      templates: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
};