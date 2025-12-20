/**
 * Create Payment API
 * POST: Initiates QRIS payment for an existing invoice
 */

import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, validateRequired } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { createPrismaClient } from '@/lib/prisma';
import { createMidtransService, validateInvoiceForPayment } from '@/lib/midtrans-client';
import { AuditLogger } from '@/lib/audit-middleware';

interface CreatePaymentRequest {
    invoiceId: string;
}

/**
 * Creates QRIS payment for existing invoice
 * Includes comprehensive validation and error handling
 */
export const POST: APIRoute = async ({ request, locals }) => {
    const prisma = createPrismaClient(locals.runtime.env);

    try {
        // Rate limiting for payment initiation 
        if (locals.runtime?.env?.CACHE) {
            const rateLimitResult = await checkRateLimit(
                request,
                locals.runtime.env.CACHE,
                'create-payment',
                { limit: 10, window: 60 } // 10 payments per minute per user
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
        const validationError = validateRequired(body, ['invoiceId']);
        if (validationError) {
            return errorResponse(validationError, 400);
        }

        const { invoiceId } = body as CreatePaymentRequest;

        // Fetch invoice with project and ensure it belongs to the user
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                project: {
                    userId: user.id,
                },
            },
            include: {
                project: true,
            },
        });

        if (!invoice) {
            return errorResponse('Invoice tidak ditemukan', 404);
        }

        // Validate invoice is ready for payment
        const invoiceValidation = validateInvoiceForPayment(invoice);
        if (!invoiceValidation.isValid) {
            return errorResponse(invoiceValidation.error, 400);
        }

        // Get user details for payment processing
        const userDetails = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
            },
        });

        if (!userDetails) {
            return errorResponse('Data pengguna tidak ditemukan', 400);
        }

        // Create Midtrans service and initiate payment
        const midtransService = createMidtransService(locals.runtime.env);
        
        try {
            // Create QRIS payment with Midtrans
            const paymentResponse = await midtransService.createQrisPayment(invoice, userDetails);

            if (!paymentResponse.success) {
                throw new Error(paymentResponse.message || 'Payment creation failed');
            }

            // Update invoice with Midtrans data (atomic operation)
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    midtransOrderId: paymentResponse.orderId,
                    qrisUrl: paymentResponse.qrisUrl,
                },
            });

            // Audit log for payment initiation
            await AuditLogger.logPayment(locals, request, {
                action: 'PAYMENT_INIT',
                resourceId: invoice.id,
                newValues: {
                    midtransOrderId: paymentResponse.orderId,
                    qrisUrl: paymentResponse.qrisUrl,
                    amount: Number(invoice.amount)
                }
            });

            return jsonResponse({
                success: true,
                payment: {
                    orderId: paymentResponse.orderId,
                    qrisUrl: paymentResponse.qrisUrl,
                    grossAmount: paymentResponse.grossAmount,
                    paymentType: paymentResponse.paymentType,
                    transactionId: paymentResponse.transactionId,
                },
                invoice: {
                    id: invoice.id,
                    amount: Number(invoice.amount),
                    projectName: invoice.project.name,
                    projectType: invoice.project.type,
                },
                message: 'Pembayaran QRIS berhasil dibuat. Silakan scan QR code untuk menyelesaikan pembayaran.',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            });

        } catch (paymentError) {
            console.error('Midtrans payment creation failed:', paymentError);
            
            // Don't update invoice state if payment creation failed
            // User can retry payment creation
            
            return errorResponse(
                'Gagal membuat pembayaran QRIS. Silakan coba lagi atau hubungi admin.',
                503
            );
        }

    } catch (error) {
        console.error('Payment initiation error:', error);
        return errorResponse('Terjadi kesalahan sistem', 500);
    } finally {
        await prisma.$disconnect();
    }
};

/**
 * GET: Get payment status for existing invoice
 */
export const GET: APIRoute = async ({ request, locals }) => {
    const prisma = createPrismaClient(locals.runtime.env);

    try {
        const user = locals.user;
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const url = new URL(request.url);
        const invoiceId = url.searchParams.get('invoiceId');

        if (!invoiceId) {
            return errorResponse('Invoice ID diperlukan', 400);
        }

        // Fetch invoice and verify ownership
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                project: {
                    userId: user.id,
                },
            },
            select: {
                id: true,
                status: true,
                midtransOrderId: true,
                qrisUrl: true,
                paidAt: true,
                createdAt: true,
                amount: true,
                project: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });

        if (!invoice) {
            return errorResponse('Invoice tidak ditemukan', 404);
        }

        // If we have a Midtrans order ID, fetch current status
        let paymentStatus = null;
        if (invoice.midtransOrderId) {
            try {
                const midtransService = createMidtransService(locals.runtime.env);
                paymentStatus = await midtransService.getPaymentStatus(invoice.midtransOrderId);
            } catch (statusError) {
                console.error('Payment status fetch failed:', statusError);
                // Don't fail the request, just continue without payment status
            }
        }

        return jsonResponse({
            invoice,
            paymentStatus,
            expired: invoice.paidAt === null && 
                    (new Date() > new Date(invoice.createdAt.getTime() + 24 * 60 * 60 * 1000)), // 24 hours expiry
        });

    } catch (error) {
        console.error('Payment status fetch error:', error);
        return errorResponse('Gagal mengambil status pembayaran', 500);
    } finally {
        await prisma.$disconnect();
    }
};