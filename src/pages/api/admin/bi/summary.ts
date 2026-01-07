import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/services/admin/auth';
import { createBIService } from '@/services/admin/bi';

export const GET: APIRoute = async (context) => {
    try {
        const authError = requireAdmin(context);
        if (authError) return authError;

        const prisma = getPrisma(context.locals);
        const kv = context.locals.runtime.env?.JASAWEB_CACHE as any;
        const biService = createBIService(prisma, kv);

        const summary = await biService.getBISummary();

        return jsonResponse(summary);
    } catch (error) {
        return handleApiError(error);
    }
};
