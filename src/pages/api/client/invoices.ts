/**
 * Client Invoices API
 * GET: List user's invoices with pagination
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Parse query parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const status = url.searchParams.get('status') as string || undefined;
        const sortBy = url.searchParams.get('sortBy') as any || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Validate pagination parameters
        if (page < 1) return errorResponse('Page harus lebih dari 0');
        if (limit < 1 || limit > 50) return errorResponse('Limit harus antara 1-50');

        // Validate sort fields
        const allowedSortFields = ['createdAt', 'amount', 'paidAt', 'status'];
        if (!allowedSortFields.includes(sortBy)) {
            return errorResponse('Sort field tidak valid');
        }

        // Validate status if provided
        if (status && !['unpaid', 'paid'].includes(status)) {
            return errorResponse('Status harus "unpaid" atau "paid"');
        }

        const prisma = getPrisma(locals);

        // Build where clause - get invoices for user's projects only
        const where: any = {
            project: {
                userId: user.id
            }
        };
        if (status) where.status = status;

        // Get total count and invoices in parallel
        const [total, invoices] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    projectId: true,
                    amount: true,
                    status: true,
                    midtransOrderId: true,
                    qrisUrl: true,
                    paidAt: true,
                    createdAt: true,
                    // Include project brief info
                    project: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return jsonResponse({
            invoices,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
};