/**
 * GET /api/admin/pricing/[id]
 * Get single pricing plan by ID
 */
import type { APIRoute } from 'astro';
import { getPricingService } from '@/services/domain/pricing';
import { 
    jsonResponse, 
    errorResponse 
} from '@/lib/api';
import { validateAdminAccess } from '@/services/admin/auth';

export const GET: APIRoute = async (context) => {
  try {
    // Validate admin access
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    const id = context.params.id;
    
    if (!id) {
      return errorResponse('Pricing plan ID is required', 400);
    }

    const pricingService = getPricingService(context.locals.runtime.env);
    
    // Since we don't have a direct getById method, we'll use identifier lookup
    const allPlans = await pricingService.getActivePricingPlans();
    const plan = allPlans.find((p: any) => p.id === id);

    if (!plan) {
      return errorResponse('Pricing plan not found', 404);
    }

    return jsonResponse(plan);

  } catch (error: any) {
    console.error('Error fetching pricing plan:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};