/**
 * Client Dashboard API
 * Returns summary stats for logged-in user
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

        // Get project counts
        const [totalProjects, inProgress, completed, unpaidInvoices] = await Promise.all([
            prisma.project.count({ where: { userId: user.id } }),
            prisma.project.count({ where: { userId: user.id, status: 'in_progress' } }),
            prisma.project.count({ where: { userId: user.id, status: 'completed' } }),
            prisma.invoice.count({
                where: {
                    project: { userId: user.id },
                    status: 'unpaid',
                },
            }),
        ]);

        return jsonResponse({
            totalProjects,
            inProgress,
            completed,
            unpaidInvoices,
        });
    } catch (error) {
        return handleApiError(error);
    }
};
