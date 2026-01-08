/**
 * Midtrans Webhook API Integration Test Suite
 * Tests webhook signature validation, enqueuing, and background processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define all mocks at module level (before describe) for vi.hoisted()
const mockPrisma = {
    webhookQueue: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    invoice: {
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    project: {
        update: vi.fn(),
    },
} as any;

const mockValidateMidtransSignature = vi.fn().mockReturnValue(true);

const mockParseMidtransWebhook = vi.fn().mockReturnValue({
    order_id: 'order-midtrans-123',
    status_code: '200',
    gross_amount: '2000000.00',
    transaction_status: 'settlement',
    signature_key: 'valid-signature',
});

const mockGetPrisma = vi.fn(() => mockPrisma);

// Mock all dependencies before importing routes
vi.mock('@/lib/prisma', () => ({
    getPrisma: mockGetPrisma,
}));

vi.mock('@/lib/midtrans', () => ({
    validateMidtransSignature: mockValidateMidtransSignature,
    parseMidtransWebhook: mockParseMidtransWebhook,
    MIDTRANS_STATUS_MAP: {
        pending: 'waiting',
        settlement: 'paid',
        cancel: 'cancelled',
        deny: 'failed',
        expire: 'expired',
        refund: 'refunded',
    },
}));

// Mock WebhookQueueService class
class MockWebhookQueueService {
    enqueueWithDeduplication = vi.fn().mockResolvedValue({
        id: 'webhook-123',
        provider: 'midtrans',
        eventType: 'payment_notification',
        status: 'PENDING',
    });
}

vi.mock('@/services/webhook-queue.service', () => ({
    WebhookQueueService: MockWebhookQueueService,
}));

describe('Midtrans Webhook API - Integration', () => {
    let mockLocals: any;
    let mockWebhookQueueService: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockLocals = {
            runtime: {
                env: {
                    MIDTRANS_SERVER_KEY: 'test-server-key',
                    JWT_SECRET: 'test-jwt-secret',
                },
            },
        };

        mockWebhookQueueService = new MockWebhookQueueService();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('POST: Webhook Endpoint', () => {
        it('should enqueue webhook with valid signature', async () => {
            const mockPayload = {
                order_id: 'order-midtrans-123',
                status_code: '200',
                gross_amount: '2000000.00',
                transaction_status: 'settlement',
                signature_key: 'valid-signature',
            };

            const requestBody = JSON.stringify(mockPayload);
            mockParseMidtransWebhook.mockReturnValue(mockPayload);

            const { POST: webhookHandler } = await import('@/pages/api/webhooks/midtrans');

            const request = new Request('http://localhost/api/webhooks/midtrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody,
            });

            const response = await webhookHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('queued');
            expect(result.data.message).toBe('Webhook enqueued for processing');
            expect(result.data.order_id).toBe('order-midtrans-123');

            expect(mockValidateMidtransSignature).toHaveBeenCalledWith(
                'order-midtrans-123',
                '200',
                '2000000.00',
                'valid-signature',
                'test-server-key'
            );

            expect(mockWebhookQueueService.enqueueWithDeduplication).toHaveBeenCalledWith({
                provider: 'midtrans',
                eventType: 'payment_notification',
                payload: mockPayload,
                signature: 'valid-signature',
                eventId: 'order-midtrans-123',
                maxRetries: 5,
                ttlSeconds: 60 * 60 * 24,
            });
        });

        it('should reject webhook with invalid signature', async () => {
            mockValidateMidtransSignature.mockReturnValue(false);
            mockParseMidtransWebhook.mockReturnValue({
                order_id: 'order-midtrans-123',
                signature_key: 'invalid-signature',
            });

            const { POST: webhookHandler } = await import('@/pages/api/webhooks/midtrans');

            const request = new Request('http://localhost/api/webhooks/midtrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: 'order-midtrans-123',
                    signature_key: 'invalid-signature',
                }),
            });

            const response = await webhookHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(401);

            const result = await response.json();
            expect(result.error).toBe('Invalid signature');

            expect(mockWebhookQueueService.enqueueWithDeduplication).not.toHaveBeenCalled();
        });

        it('should reject empty webhook payload', async () => {
            mockParseMidtransWebhook.mockReturnValue(null);

            const { POST: webhookHandler } = await import('@/pages/api/webhooks/midtrans');

            const request = new Request('http://localhost/api/webhooks/midtrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '',
            });

            const response = await webhookHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);

            const result = await response.json();
            expect(result.error).toBe('Empty webhook payload');
        });

        it('should reject invalid webhook payload format', async () => {
            mockParseMidtransWebhook.mockReturnValue(null);

            const { POST: webhookHandler } = await import('@/pages/api/webhooks/midtrans');

            const request = new Request('http://localhost/api/webhooks/midtrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invalid: 'payload' }),
            });

            const response = await webhookHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);

            const result = await response.json();
            expect(result.error).toBe('Invalid webhook payload format');
        });

        it('should handle missing MIDTRANS_SERVER_KEY', async () => {
            const testLocals = {
                ...mockLocals,
                runtime: {
                    env: {
                        ...mockLocals.runtime.env,
                        MIDTRANS_SERVER_KEY: undefined,
                    },
                },
            };

            const { POST: webhookHandler } = await import('@/pages/api/webhooks/midtrans');

            const request = new Request('http://localhost/api/webhooks/midtrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: 'order-midtrans-123',
                    signature_key: 'valid-signature',
                }),
            });

            const response = await webhookHandler({ request, locals: testLocals } as any);

            expect(response.status).toBe(503);

            const result = await response.json();
            expect(result.error).toBe('Payment service unavailable');
        });
    });

    describe('Background Processing Function', () => {
        let mockInvoice: any;
        let mockWebhook: any;

        beforeEach(() => {
            mockInvoice = {
                id: 'invoice-123',
                projectId: 'project-123',
                amount: 2000000 as any,
                status: 'unpaid',
                midtransOrderId: 'order-midtrans-123',
                qrisUrl: 'https://qris.example.com/qr-code',
                paidAt: null,
                project: {
                    id: 'project-123',
                    status: 'pending_payment',
                },
            };

            mockWebhook = {
                payload: {
                    order_id: 'order-midtrans-123',
                    transaction_status: 'settlement',
                    gross_amount: '2000000',
                    signature_key: 'valid-signature',
                },
            };

            mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.update.mockResolvedValue({
                id: 'invoice-123',
                status: 'paid',
                paidAt: new Date(),
            });
            mockPrisma.project.update.mockResolvedValue({
                id: 'project-123',
                status: 'in_progress',
            });
        });

        it('should update invoice status to paid for settlement', async () => {
            const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

            await processMidtransWebhook(mockPrisma, mockWebhook);

            expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith({
                where: { midtransOrderId: 'order-midtrans-123' },
                include: { project: true },
            });

            expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                data: {
                    status: 'paid',
                    paidAt: expect.any(Date),
                },
            });
        });

        it('should update project status to in_progress when paid', async () => {
            const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

            await processMidtransWebhook(mockPrisma, mockWebhook);

            expect(mockPrisma.project.update).toHaveBeenCalledWith({
                where: { id: 'project-123' },
                data: { status: 'in_progress' },
            });
        });

        it('should not update project status if not pending_payment', async () => {
            mockInvoice.project.status = 'in_progress';

            const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

            await processMidtransWebhook(mockPrisma, mockWebhook);

            expect(mockPrisma.project.update).not.toHaveBeenCalled();
        });

        it('should handle missing invoice gracefully', async () => {
            mockPrisma.invoice.findFirst.mockResolvedValue(null);

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

            await expect(processMidtransWebhook(mockPrisma, mockWebhook)).resolves.toBeUndefined();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invoice not found for order')
            );

            consoleWarnSpy.mockRestore();
        });

        it('should validate amount matches invoice', async () => {
            mockWebhook.payload.gross_amount = '1500000';

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

            await expect(
                processMidtransWebhook(mockPrisma, mockWebhook)
            ).rejects.toThrow('Amount validation failed');

            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should handle unknown transaction status', async () => {
            mockWebhook.payload.transaction_status = 'unknown_status';

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

            await expect(processMidtransWebhook(mockPrisma, mockWebhook)).resolves.toBeUndefined();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown transaction status')
            );

            expect(mockPrisma.invoice.update).not.toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });

        it('should map transaction status to invoice status correctly', async () => {
            const statusTests = [
                { transaction: 'pending', expected: 'waiting' },
                { transaction: 'settlement', expected: 'paid' },
                { transaction: 'cancel', expected: 'cancelled' },
                { transaction: 'deny', expected: 'failed' },
                { transaction: 'expire', expected: 'expired' },
                { transaction: 'refund', expected: 'refunded' },
            ];

            for (const { transaction, expected } of statusTests) {
                vi.clearAllMocks();
                mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);

                mockWebhook.payload.transaction_status = transaction;

                const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

                await processMidtransWebhook(mockPrisma, mockWebhook);

                expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            status: expected,
                        }),
                    })
                );
            }
        });

        it('should set paidAt only for paid status', async () => {
            const paidTest = async (status: string, shouldSetPaidAt: boolean) => {
                vi.clearAllMocks();
                mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);

                mockWebhook.payload.transaction_status = status;

                const { processMidtransWebhook } = await import('@/pages/api/webhooks/midtrans');

                await processMidtransWebhook(mockPrisma, mockWebhook);

                const updateCall = mockPrisma.invoice.update.mock.calls[0];
                if (shouldSetPaidAt) {
                    expect(updateCall[0].data.paidAt).toBeDefined();
                    expect(updateCall[0].data.paidAt).toBeInstanceOf(Date);
                } else {
                    expect(updateCall[0].data.paidAt).toBeNull();
                }
            };

            await paidTest('settlement', true);
            await paidTest('pending', false);
            await paidTest('cancel', false);
        });
    });
});
