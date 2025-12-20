/**
 * Client Invoices API
 * GET: List user's invoices with pagination
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { parseQuery, createPrismaQuery, createResponse } from '@/lib/pagination';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Parse query parameters using pagination service
        const url = new URL(request.url);
        const query = parseQuery(url, {
            maxLimit: 50,
            defaultSortBy: 'createdAt',
            defaultSortOrder: 'desc',
            allowedSortFields: ['createdAt', 'amount', 'paidAt', 'status'],
            filters: {
                project: {
                    userId: user.id
                }
            }
        });

        // Validate status if provided
        const status = query.filters.status;
        if (status && !['unpaid', 'paid'].includes(status)) {
            return errorResponse('Status harus "unpaid" atau "paid"');
        }

        const prisma = getPrisma(locals);

        // Add search if provided (search in project name)
        let where = { ...query.filters };
        if (query.search) {
            where = {
                ...where,
                project: {
                    ...where.project,
                    name: { contains: query.search, mode: 'insensitive' as const }
                }
            };
        }

        // Create Prisma query with pagination
        const prismaQuery = createPrismaQuery(query.pagination, query.sort, where);

        // Get total count and invoices in parallel
        const [total, invoices] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.findMany({
                ...prismaQuery,
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
            }),
        ]);

        // Create paginated response
        const response = createResponse(invoices, total, query.pagination);

        return jsonResponse({
            invoices: response.data,
            pagination: response.pagination,
        });
    } catch (error) {
        return handleApiError(error);
    }
};