import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { createAuditService } from '@/lib/audit';
import { getPrisma } from '@/lib/prisma';
import type { AuditAction } from '@/lib/audit';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user || user.role !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const searchParams = new URL(url).searchParams;
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') as AuditAction || undefined,
      resource: searchParams.get('resource') || undefined,
      resourceId: searchParams.get('resourceId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    // Validate limit
    if (filters.limit > 100) {
      return errorResponse('Limit cannot exceed 100', 400);
    }

    const auditService = createAuditService(getPrisma(locals));
    const result = await auditService.getAuditLogs(filters);

    return jsonResponse(result);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return errorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user || user.role !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const auditService = createAuditService(getPrisma(locals));

    await auditService.logWithRequest({
      userId: body.userId,
      action: body.action,
      resource: body.resource,
      resourceId: body.resourceId,
      oldValues: body.oldValues,
      newValues: body.newValues,
    }, request);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return errorResponse('Internal server error', 500);
  }
};