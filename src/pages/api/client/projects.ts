/**
 * Client Projects API
 * GET: List user's projects
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

export const GET: APIRoute = async ({ locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const prisma = getPrisma(locals);

        const projects = await prisma.project.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                status: true,
                url: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return jsonResponse(projects);
    } catch (error) {
        return handleApiError(error);
    }
};
