/**
 * POST /api/admin/pricing
 * Create new pricing plan
 */
import type { APIRoute } from 'astro';
import { getPricingService } from '@/services/domain/pricing';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse,
    validateRequired 
} from '@/lib/api';
import { validateAdminAccess } from '@/services/admin/auth';
import { createAuditService } from '@/lib/audit';

export const POST: APIRoute = async (context) => {
  try {
    // Validate admin access
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    const body = await context.request.json();
    const required = ['identifier', 'name', 'price', 'description', 'features'];
    const validation = validateRequired(body, required);
    if (validation) {
      return errorResponse(validation);
    }

    // Validate unique identifier
    const pricingService = getPricingService(context.locals.runtime.env);
    const existingPlan = await pricingService.getPricingPlanByIdentifier(body.identifier);
    if (existingPlan) {
      return errorResponse('Pricing plan with this identifier already exists', 400);
    }

    // Create pricing plan
    const newPlan = await pricingService.createPricingPlan({
      identifier: body.identifier,
      name: body.name,
      price: Number(body.price),
      description: body.description,
      features: Array.isArray(body.features) ? body.features : [body.features],
      popular: Boolean(body.popular),
      color: body.color || 'primary',
      sortOrder: Number(body.sortOrder) || 999,
    });

    // Log audit
    const auditService = createAuditService(getPrisma(context.locals));
    await auditService.log({
      userId: context.locals.user?.id,
      action: 'CREATE',
      resource: 'pricing_plan',
      resourceId: newPlan.id,
      oldValues: undefined,
      newValues: newPlan as unknown as Record<string, unknown>,
      ipAddress: context.request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: context.request.headers.get('user-agent') || 'unknown'
    });

    return jsonResponse(newPlan, 201);

  } catch (error: any) {
    console.error('Error creating pricing plan:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};