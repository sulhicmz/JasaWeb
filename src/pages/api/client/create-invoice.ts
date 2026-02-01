/**
 * Create Invoice API
 * POST: Creates new invoice for a project with idempotency
 */

import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, validateRequired } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { createPrismaClient } from '@/lib/prisma';
import { formatPrice } from '@/lib/config';

interface CreateInvoiceRequest {
    projectId: string;
    // Amount is calculated from project type, not provided by client
}

/**
 * Creates invoice with proper validation and idempotency
 * Rate limited to prevent abuse
 */
export const POST: APIRoute = async ({ request, locals }) => {
    const prisma = createPrismaClient(locals.runtime.env);

    try {
        // Rate limiting for invoice creation (prevent spam)
        if (locals.runtime?.env?.CACHE) {
            const rateLimitResult = await checkRateLimit(
                request,
                locals.runtime.env.CACHE,
                'create-invoice',
                { limit: 5, window: 60 } // 5 invoices per minute
            );
            if (rateLimitResult) {
                return rateLimitResult;
            }
        }

        const user = locals.user;
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Parse and validate request body
        const body = await request.json();
        const validationError = validateRequired(body, ['projectId']);
        if (validationError) {
            return errorResponse(validationError, 400);
        }

        const { projectId } = body as CreateInvoiceRequest;

        // Validate project exists and belongs to user
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
            include: {
                invoices: true, // Include to check for existing invoices
            },
        });

        if (!project) {
            return errorResponse('Project tidak ditemukan', 404);
        }

        // Check if project already has an unpaid invoice (idempotency)
        const existingUnpaidInvoice = project.invoices.find(inv => inv.status === 'unpaid');
        if (existingUnpaidInvoice) {
            return jsonResponse({
                invoice: existingUnpaidInvoice,
                message: 'Invoice sudah ada. Gunakan invoice yang ada atau hubungi admin.',
                duplicate: true,
            });
        }

        // Calculate amount based on project type from database
        const pricingConfig = await prisma.pricingPlan.findUnique({
            where: { identifier: project.type }
        });
        if (!pricingConfig) {
            return errorResponse('Tipe project tidak valid', 400);
        }

        const amount = Number(pricingConfig.price);

        // Create invoice with idempotency check
        const invoice = await prisma.invoice.create({
            data: {
                projectId: project.id,
                amount,
                status: 'unpaid',
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        userId: true,
                    },
                },
            },
        });

        // Invoice created successfully - audit trail handled by database

        return jsonResponse({
            invoice,
            pricing: {
                type: pricingConfig.name,
                amount,
                amountFormatted: formatPrice(amount),
            },
            message: 'Invoice berhasil dibuat. Lanjutkan ke pembayaran.',
        });

    } catch (error) {
        console.error('Invoice creation error:', error);
        return errorResponse('Gagal membuat invoice', 500);
    } finally {
        await prisma.$disconnect();
    }
};