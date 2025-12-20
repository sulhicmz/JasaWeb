/**
 * Admin Templates API
 * CRUD operations for template management
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
  jsonResponse, 
  errorResponse, 
  validateRequired, 
  handleApiError 
} from '@/lib/api';
import { validateAdminAccess } from '@/services/admin/auth';
import { validateCsrfToken, CSRF_COOKIE } from '@/lib/auth';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

// POST /api/admin/templates - Create template
export const POST: APIRoute = async (context) => {
  // Rate limiting
  if (context.locals.runtime?.env?.CACHE) {
    const rateLimitResult = await checkRateLimit(
      context.request, 
      context.locals.runtime.env.CACHE, 
      'admin:templates:create', 
      RateLimits.api
    );
    if (rateLimitResult) return rateLimitResult;
  }

  try {
    // Authentication and admin validation
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    // CSRF protection
    const csrfToken = context.request.headers.get('x-csrf-token');
    const csrfCookie = context.cookies.get(CSRF_COOKIE)?.value || null;
    if (!validateCsrfToken(csrfToken, csrfCookie)) {
      return errorResponse('Invalid CSRF token', 403);
    }

    const body = await context.request.json();
    const error = validateRequired(body, ['name', 'category', 'imageUrl', 'demoUrl']);
    if (error) return errorResponse(error);

    // Validate category
    const validCategories = ['sekolah', 'berita', 'company'];
    if (!validCategories.includes(body.category)) {
      return errorResponse('Kategori harus salah satu dari: sekolah, berita, company');
    }

    // Validate URLs
    try {
      new URL(body.imageUrl);
      new URL(body.demoUrl);
    } catch {
      return errorResponse('URL harus valid');
    }

    const prisma = getPrisma(context.locals);

    const template = await prisma.template.create({
      data: {
        name: body.name,
        category: body.category,
        imageUrl: body.imageUrl,
        demoUrl: body.demoUrl,
      },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        demoUrl: true,
        createdAt: true,
      },
    });

    return jsonResponse({
      message: 'Template berhasil dibuat',
      template,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/admin/templates/[id] - Update template
export const PUT: APIRoute = async (context) => {
  // Rate limiting
  if (context.locals.runtime?.env?.CACHE) {
    const rateLimitResult = await checkRateLimit(
      context.request, 
      context.locals.runtime.env.CACHE, 
      'admin:templates:update', 
      RateLimits.api
    );
    if (rateLimitResult) return rateLimitResult;
  }

  try {
    // Authentication and admin validation
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    // CSRF protection
    const csrfToken = context.request.headers.get('x-csrf-token');
    const csrfCookie = context.cookies.get(CSRF_COOKIE)?.value || null;
    if (!validateCsrfToken(csrfToken, csrfCookie)) {
      return errorResponse('Invalid CSRF token', 403);
    }

    const { id } = context.params;
    if (!id) return errorResponse('Template ID diperlukan');

    const body = await context.request.json();

    const prisma = getPrisma(context.locals);

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return errorResponse('Template tidak ditemukan', 404);
    }

    // Validate category if provided
    if (body.category) {
      const validCategories = ['sekolah', 'berita', 'company'];
      if (!validCategories.includes(body.category)) {
        return errorResponse('Kategori harus salah satu dari: sekolah, berita, company');
      }
    }

    // Validate URLs if provided
    if (body.imageUrl) {
      try {
        new URL(body.imageUrl);
      } catch {
        return errorResponse('Image URL harus valid');
      }
    }

    if (body.demoUrl) {
      try {
        new URL(body.demoUrl);
      } catch {
        return errorResponse('Demo URL harus valid');
      }
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.category && { category: body.category }),
        ...(body.imageUrl && { imageUrl: body.imageUrl }),
        ...(body.demoUrl && { demoUrl: body.demoUrl }),
      },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        demoUrl: true,
        createdAt: true,
      },
    });

    return jsonResponse({
      message: 'Template berhasil diupdate',
      template,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/admin/templates/[id] - Delete template
export const DELETE: APIRoute = async (context) => {
  // Rate limiting
  if (context.locals.runtime?.env?.CACHE) {
    const rateLimitResult = await checkRateLimit(
      context.request, 
      context.locals.runtime.env.CACHE, 
      'admin:templates:delete', 
      RateLimits.api
    );
    if (rateLimitResult) return rateLimitResult;
  }

  try {
    // Authentication and admin validation
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    // CSRF protection
    const csrfToken = context.request.headers.get('x-csrf-token');
    const csrfCookie = context.cookies.get(CSRF_COOKIE)?.value || null;
    if (!validateCsrfToken(csrfToken, csrfCookie)) {
      return errorResponse('Invalid CSRF token', 403);
    }

    const { id } = context.params;
    if (!id) return errorResponse('Template ID diperlukan');

    const prisma = getPrisma(context.locals);

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return errorResponse('Template tidak ditemukan', 404);
    }

    await prisma.template.delete({
      where: { id },
    });

    return jsonResponse({
      message: 'Template berhasil dihapus',
    });
  } catch (error) {
    return handleApiError(error);
  }
};