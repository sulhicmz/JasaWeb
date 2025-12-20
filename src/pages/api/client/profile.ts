/**
 * Client Profile API
 * GET: Get profile
 * PUT: Update profile
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError, parseBody } from '@/lib/api';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

export const GET: APIRoute = async ({ locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const prisma = getPrisma(locals);

        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return jsonResponse(profile);
    } catch (error) {
        return handleApiError(error);
    }
};

export const PUT: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Rate limiting for profile updates
        const rateLimit = await checkRateLimit(
            request,
            locals.runtime.env.CACHE,
            'profile-update',
            RateLimits.api
        );
        if (rateLimit) return rateLimit;

        const body = await parseBody<{ name?: string; phone?: string }>(request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        const prisma = getPrisma(locals);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.phone !== undefined && { phone: body.phone || null }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });

        return jsonResponse({ message: 'Profil berhasil diperbarui', user: updatedUser });
    } catch (error) {
        return handleApiError(error);
    }
};
