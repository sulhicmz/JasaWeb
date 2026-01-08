/**
 * Payment API Routes Integration Test Suite
 * Tests payment initiation and status checking endpoints with comprehensive scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Invoice, Project } from '@prisma/client';

// Mock all dependencies before importing routes
const mockPrisma = {
    invoice: {
        findFirst: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
    },
    $disconnect: vi.fn(),
} as any;

const mockMidtransService = {
    createQrisPayment: vi.fn(),
    getPaymentStatus: vi.fn(),
};

const mockCheckRateLimit = vi.fn();
const mockValidateInvoiceForPayment = vi.fn();
const mockCreateMidtransService = vi.fn();
const mockCreatePrismaClient = vi.fn();
const mockAuditLogger = {
    logPayment: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({
    createPrismaClient: mockCreatePrismaClient,
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: mockCheckRateLimit,
}));

vi.mock('@/lib/midtrans-client', () => ({
    createMidtransService: mockCreateMidtransService,
    validateInvoiceForPayment: mockValidateInvoiceForPayment,
}));

vi.mock('@/lib/audit-middleware', () => ({
    AuditLogger: {
        logPayment: mockAuditLogger.logPayment,
    },
}));

describe('Payment API Routes - Integration', () => {
    let mockUser: any;
    let mockInvoice: Invoice & { project: Project };
    let mockLocals: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUser = {
            id: 'user-123',
            email: 'client@example.com',
            name: 'Test Client',
            role: 'client',
        };

        mockInvoice = {
            id: 'invoice-123',
            projectId: 'project-123',
            amount: { toNumber: () => 2000000 } as any, // Prisma Decimal
            status: 'unpaid' as const,
            midtransOrderId: null,
            qrisUrl: null,
            paidAt: null,
            createdAt: new Date('2024-01-01'),
            project: {
                id: 'project-123',
                userId: 'user-123',
                name: 'Company Website',
                type: 'company' as const,
                status: 'pending_payment' as const,
                url: null,
                credentials: null,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
        } as Invoice & { project: Project };

        mockLocals = {
            user: mockUser,
            runtime: {
                env: {
                    DATABASE_URL: 'test-db-url',
                    MIDTRANS_SERVER_KEY: 'test-server-key',
                    MIDTRANS_CLIENT_KEY: 'test-client-key',
                    MIDTRANS_IS_PRODUCTION: 'false',
                    CACHE: {
                        get: vi.fn(),
                        put: vi.fn(),
                    },
                },
            },
        };

        mockCreatePrismaClient.mockReturnValue(mockPrisma);
        mockCreateMidtransService.mockReturnValue(mockMidtransService);
        mockCheckRateLimit.mockResolvedValue(null);
        mockValidateInvoiceForPayment.mockReturnValue({ isValid: true });
        mockPrisma.user.findUnique.mockResolvedValue({
            phone: '+62812345678',
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('POST: Create Payment', () => {
        it('should create QRIS payment successfully', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
            mockMidtransService.createQrisPayment.mockResolvedValue({
                success: true,
                orderId: 'order-midtrans-123',
                qrisUrl: 'https://qris.example.com/qr-code',
                grossAmount: '2000000',
                paymentType: 'qris',
                transactionId: 'txn-123',
            });

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.payment.orderId).toBe('order-midtrans-123');
            expect(result.data.payment.qrisUrl).toBe('https://qris.example.com/qr-code');
            expect(result.data.invoice.projectName).toBe('Company Website');

            expect(mockMidtransService.createQrisPayment).toHaveBeenCalledWith(
                mockInvoice,
                {
                    email: mockUser.email,
                    name: mockUser.name,
                    phone: '+62812345678',
                }
            );

            expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                data: {
                    midtransOrderId: 'order-midtrans-123',
                    qrisUrl: 'https://qris.example.com/qr-code',
                },
            });

            expect(mockAuditLogger.logPayment).toHaveBeenCalledWith(
                mockLocals,
                request,
                expect.objectContaining({
                    action: 'PAYMENT_INIT',
                    resourceId: 'invoice-123',
                })
            );
        });

        it('should reject unauthenticated requests', async () => {
            mockLocals.user = null;
            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should reject requests without invoiceId', async () => {
            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // missing invoiceId
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toMatch(/invoiceId/);
        });

        it('should reject requests with non-existent invoice', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(null);
            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'non-existent-invoice',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Invoice tidak ditemukan');
        });

        it('should reject requests for other users invoices', async () => {
            const otherUserInvoice = {
                ...mockInvoice,
                project: {
                    ...mockInvoice.project,
                    userId: 'other-user-456',
                },
            };

            mockPrisma.invoice.findFirst.mockImplementation((query: any) => {
                const invoiceId = query.where.id;
                const userId = query.where.project?.userId;
                return userId !== 'other-user-456' ? null : Promise.resolve(otherUserInvoice);
            });

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Invoice tidak ditemukan');

            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
        });

        it('should reject invalid invoice status', async () => {
            mockValidateInvoiceForPayment.mockReturnValue({
                isValid: false,
                error: 'Invoice sudah dibayar',
            });
            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invoice sudah dibayar');
        });

        it('should apply rate limiting when exceeded', async () => {
            const rateLimitResponse = new Response(
                JSON.stringify({ error: 'Too many requests' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
            mockCheckRateLimit.mockResolvedValue(rateLimitResponse);

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(429);
        });

        it('should handle Midtrans payment creation failure', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
            mockMidtransService.createQrisPayment.mockResolvedValue({
                success: false,
                message: 'Midtrans service unavailable',
            });

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(503);
            const data = await response.json();
            expect(data.error).toContain('Gagal membuat pembayaran QRIS');

            expect(mockPrisma.invoice.update).not.toHaveBeenCalled();
        });

        it('should handle Midtrans service exception', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
            mockMidtransService.createQrisPayment.mockRejectedValue(
                new Error('Midtrans API timeout')
            );

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const response = await paymentHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(503);
            const data = await response.json();
            expect(data.error).toContain('Gagal membuat pembayaran QRIS');
        });

        it('should return 24 hour expiry time', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
            mockMidtransService.createQrisPayment.mockResolvedValue({
                success: true,
                orderId: 'order-midtrans-123',
                qrisUrl: 'https://qris.example.com/qr-code',
                grossAmount: '2000000',
                paymentType: 'qris',
                transactionId: 'txn-123',
            });

            const { POST: paymentHandler } = await import('@/pages/api/client/payment');

            const request = new Request('http://localhost/api/client/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: 'invoice-123',
                }),
            });

            const beforeCreate = Date.now();
            const response = await paymentHandler({ request, locals: mockLocals } as any);
            const afterCreate = Date.now();

            const result = await response.json();
            const expiresAt = new Date(result.data.expiresAt);
            const expectedExpiry = beforeCreate + 24 * 60 * 60 * 1000;
            const tolerance = 1000;

            expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(afterCreate + 24 * 60 * 60 * 1000 + tolerance);
        });
    });

    describe('GET: Payment Status', () => {
        it('should return payment status for authenticated user', async () => {
            const paidInvoice = {
                ...mockInvoice,
                status: 'paid',
                midtransOrderId: 'order-midtrans-123',
                qrisUrl: 'https://qris.example.com/qr-code',
                paidAt: new Date('2024-01-02'),
            };

            mockPrisma.invoice.findFirst.mockResolvedValue(paidInvoice);
            mockMidtransService.getPaymentStatus.mockResolvedValue({
                transaction_status: 'settlement',
                gross_amount: '2000000',
            });

            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=invoice-123');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.invoice.id).toBe('invoice-123');
            expect(result.data.invoice.status).toBe('paid');
            expect(result.data.paymentStatus).toEqual({
                transaction_status: 'settlement',
                gross_amount: '2000000',
            });
            expect(result.data.expired).toBe(false);
        });

        it('should identify expired unpaid invoices', async () => {
            const oldInvoice = {
                ...mockInvoice,
                status: 'unpaid',
                createdAt: new Date('2024-01-01'),
                paidAt: null,
            };

            mockPrisma.invoice.findFirst.mockResolvedValue(oldInvoice);

            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=invoice-123');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.expired).toBe(true);
        });

        it('should reject unauthenticated requests', async () => {
            mockLocals.user = null;
            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=invoice-123');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should reject requests without invoiceId', async () => {
            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invoice ID diperlukan');
        });

        it('should return 404 for non-existent invoice', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(null);
            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=non-existent');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Invoice tidak ditemukan');
        });

        it('should handle Midtrans status fetch failure gracefully', async () => {
            const paidInvoice = {
                ...mockInvoice,
                status: 'paid',
                midtransOrderId: 'order-midtrans-123',
                paidAt: new Date('2024-01-02'),
            };

            mockPrisma.invoice.findFirst.mockResolvedValue(paidInvoice);
            mockMidtransService.getPaymentStatus.mockRejectedValue(
                new Error('Midtrans API timeout')
            );

            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=invoice-123');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.invoice.status).toBe('paid');
            expect(result.data.paymentStatus).toBeNull();
        });

        it('should return invoice without Midtrans status when no order ID exists', async () => {
            const unpaidInvoice = {
                ...mockInvoice,
                midtransOrderId: null,
            };

            mockPrisma.invoice.findFirst.mockResolvedValue(unpaidInvoice);

            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=invoice-123');
            const request = new Request(url);

            const response = await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.invoice.midtransOrderId).toBeNull();
            expect(result.data.paymentStatus).toBeNull();
            expect(mockMidtransService.getPaymentStatus).not.toHaveBeenCalled();
        });

        it('should always disconnect prisma connection', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);

            const { GET: paymentStatusHandler } = await import('@/pages/api/client/payment');

            const url = new URL('http://localhost/api/client/payment?invoiceId=invoice-123');
            const request = new Request(url);

            await paymentStatusHandler({ request, locals: mockLocals } as any);

            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
    });
});
