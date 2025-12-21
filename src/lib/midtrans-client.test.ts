/**
 * Payment Service Tests
 * Comprehensive test suite for Midtrans client and payment functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    createMidtransService, 
    validateInvoiceForPayment, 
    formatMidtransAmount,
    isPaymentExpired,
    PAYMENT_EXPIRY_HOURS
} from '@/lib/midtrans-client';
import type { Invoice, Project } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Midtrans CoreApi
const mockCoreApi = {
    charge: vi.fn(),
    transaction: {
        status: vi.fn(),
        cancel: vi.fn(),
        refund: vi.fn(),
    },
};

// Mock the midtrans-client module
vi.mock('midtrans-client', () => ({
    CoreApi: class MockCoreApi {
        constructor(_options: any) {
            Object.assign(this, mockCoreApi);
        }
    },
}));

describe('Midtrans Payment Service', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    
    const mockRuntime = {
        MIDTRANS_IS_PRODUCTION: 'false',
        MIDTRANS_SERVER_KEY: 'SB-Mid-server-TEST123',
        MIDTRANS_CLIENT_KEY: 'SB-Mid-client-TEST456',
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+62812345678',
    };

    const mockProject: Project = {
        id: 'project-123',
        userId: 'user-123',
        name: 'Test Website',
        type: 'company',
        status: 'pending_payment',
        url: null,
        credentials: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockInvoice: Invoice & { project: Project } = {
        id: 'invoice-123',
        projectId: 'project-123',
        amount: new Decimal(2000000),
        status: 'unpaid',
        midtransOrderId: null,
        qrisUrl: null,
        paidAt: null,
        createdAt: new Date(),
        project: mockProject,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console errors for expected payment failures
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console error logging
        consoleSpy.mockRestore();
    });

    describe('createMidtransService', () => {
        it('should create service with runtime environment', () => {
            const service = createMidtransService(mockRuntime);
            expect(service).toBeDefined();
        });

        it('should throw error when keys are not configured', () => {
            const invalidRuntime = { ...mockRuntime, MIDTRANS_SERVER_KEY: '' };
            expect(() => createMidtransService(invalidRuntime)).toThrow('Midtrans keys not configured');
        });
    });

    describe('validateInvoiceForPayment', () => {
        it('should validate unpaid invoice', () => {
            const result = validateInvoiceForPayment(mockInvoice);
            expect(result.isValid).toBe(true);
            expect(result.error).toBe('');
        });

        it('should reject paid invoice', () => {
            const paidInvoice = { ...mockInvoice, status: 'paid' as const };
            const result = validateInvoiceForPayment(paidInvoice);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('paid'); // Changed from 'sudah dibayar'
        });

        it('should reject invoice with existing payment', () => {
            const existingPaymentInvoice = { 
                ...mockInvoice, 
                midtransOrderId: 'ORDER-123' 
            };
            const result = validateInvoiceForPayment(existingPaymentInvoice);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('sudah pernah dibuat');
        });

        it('should reject invoice with invalid amount', () => {
            const invalidAmountInvoice = { ...mockInvoice, amount: new Decimal(0) };
            const result = validateInvoiceForPayment(invalidAmountInvoice);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('amount tidak valid');
        });

        it('should reject invoice without project', () => {
            const invoiceWithoutProject = { ...mockInvoice, project: null as any };
            const result = validateInvoiceForPayment(invoiceWithoutProject);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Project tidak ditemukan');
        });
    });

    describe('createQrisPayment', () => {
        it('should create QRIS payment successfully', async () => {
            const mockChargeResponse = {
                status_code: '201',
                order_id: 'INV-INVOICE1-1234567890',
                gross_amount: 2000000,
                payment_type: 'qris',
                transaction_id: 'trans-123',
                status_message: 'Success',
                actions: [{
                    name: 'generate-qr-code',
                    method: 'GET',
                    url: 'https://api.midtrans.com/v2/qris/INV-INVOICE1-1234567890/qr-code',
                }],
            };

            mockCoreApi.charge.mockResolvedValue(mockChargeResponse);

            const service = createMidtransService(mockRuntime);
            const result = await service.createQrisPayment(mockInvoice, mockUser);

            expect(result.success).toBe(true);
            expect(result.orderId).toBe('INV-INVOICE1-1234567890');
            expect(result.qrisUrl).toBe('https://api.midtrans.com/v2/qris/INV-INVOICE1-1234567890/qr-code');
            expect(result.grossAmount).toBe(2000000);
            expect(result.paymentType).toBe('qris');

            // Verify the charge was called with correct parameters
            expect(mockCoreApi.charge).toHaveBeenCalledWith(
                expect.objectContaining({
                    payment_type: 'qris',
                    transaction_details: {
                        order_id: expect.stringMatching(/^INV-INVOICE-/),
                        gross_amount: 2000000,
                    },
                    customer_details: {
                        email: 'test@example.com',
                        first_name: 'Test',
                        last_name: 'User',
                        phone: '+62812345678',
                    },
                    item_details: [{
                        id: 'project-123',
                        name: 'COMPANY - Test Website',
                        price: 2000000,
                        quantity: 1,
                        category: 'company',
                    }],
                    qris: {
                        acquirer: 'gopay',
                    },
                    custom_field1: 'project-123',
                    custom_field2: 'invoice-123',
                })
            );
        });

        it('should handle charge failure gracefully', async () => {
            mockCoreApi.charge.mockRejectedValue(new Error('Midtrans API Error'));

            const service = createMidtransService(mockRuntime);
            
            await expect(service.createQrisPayment(mockInvoice, mockUser))
                .rejects.toThrow('Payment creation failed: Midtrans API Error');
        });

        it('should handle invalid charge response', async () => {
            mockCoreApi.charge.mockResolvedValue({ invalid_response: true });

            const service = createMidtransService(mockRuntime);
            
            await expect(service.createQrisPayment(mockInvoice, mockUser))
                .rejects.toThrow('Payment creation failed: Invalid payment response from Midtrans');
        });

        it('should handle missing QRIS URL in response', async () => {
            const mockResponse = {
                status_code: '201',
                actions: [],
            };

            mockCoreApi.charge.mockResolvedValue(mockResponse);

            const service = createMidtransService(mockRuntime);
            
            await expect(service.createQrisPayment(mockInvoice, mockUser))
                .rejects.toThrow('Payment creation failed: QRIS URL not found in payment response');
        });
    });

    describe('getPaymentStatus', () => {
        it('should fetch payment status successfully', async () => {
            const mockStatusResponse = {
                status_code: '200',
                transaction_status: 'settlement',
                gross_amount: '2000000.00',
            };

            mockCoreApi.transaction.status.mockResolvedValue(mockStatusResponse);

            const service = createMidtransService(mockRuntime);
            const result = await service.getPaymentStatus('ORDER-123');

            expect(result).toEqual(mockStatusResponse);
            expect(mockCoreApi.transaction.status).toHaveBeenCalledWith('ORDER-123');
        });

        it('should handle status fetch failure', async () => {
            mockCoreApi.transaction.status.mockRejectedValue(new Error('Status fetch failed'));

            const service = createMidtransService(mockRuntime);
            
            await expect(service.getPaymentStatus('ORDER-123'))
                .rejects.toThrow('Status check failed: Status fetch failed');
        });
    });

    describe('cancelPayment', () => {
        it('should cancel payment successfully', async () => {
            const mockCancelResponse = {
                status_code: '200',
                transaction_status: 'cancel',
            };

            mockCoreApi.transaction.cancel.mockResolvedValue(mockCancelResponse);

            const service = createMidtransService(mockRuntime);
            const result = await service.cancelPayment('ORDER-123');

            expect(result).toEqual(mockCancelResponse);
            expect(mockCoreApi.transaction.cancel).toHaveBeenCalledWith('ORDER-123');
        });

        it('should handle cancellation failure', async () => {
            mockCoreApi.transaction.cancel.mockRejectedValue(new Error('Cancel failed'));

            const service = createMidtransService(mockRuntime);
            
            await expect(service.cancelPayment('ORDER-123'))
                .rejects.toThrow('Cancellation failed: Cancel failed');
        });
    });

    describe('refundPayment', () => {
        it('should refund payment successfully', async () => {
            const mockRefundResponse = {
                status_code: '200',
                transaction_status: 'refund',
            };

            mockCoreApi.transaction.refund.mockResolvedValue(mockRefundResponse);

            const service = createMidtransService(mockRuntime);
            const result = await service.refundPayment('ORDER-123', 1000000);

            expect(result).toEqual(mockRefundResponse);
            expect(mockCoreApi.transaction.refund).toHaveBeenCalledWith('ORDER-123', { amount: 1000000 });
        });

        it('should handle refund without amount parameter', async () => {
            const mockRefundResponse = {
                status_code: '200',
                transaction_status: 'refund',
            };

            mockCoreApi.transaction.refund.mockResolvedValue(mockRefundResponse);

            const service = createMidtransService(mockRuntime);
            const result = await service.refundPayment('ORDER-123');

            expect(result).toEqual(mockRefundResponse);
            expect(mockCoreApi.transaction.refund).toHaveBeenCalledWith('ORDER-123', {});
        });

        it('should handle refund failure', async () => {
            mockCoreApi.transaction.refund.mockRejectedValue(new Error('Refund failed'));

            const service = createMidtransService(mockRuntime);
            
            await expect(service.refundPayment('ORDER-123'))
                .rejects.toThrow('Refund failed: Refund failed');
        });
    });

    describe('Utility Functions', () => {
        describe('formatMidtransAmount', () => {
            it('should format number correctly', () => {
                expect(formatMidtransAmount(2000000)).toBe(2000000);
                expect(formatMidtransAmount(2000000.50)).toBe(2000001);
                expect(formatMidtransAmount(2000000.49)).toBe(2000000);
            });

            it('should format string correctly', () => {
                expect(formatMidtransAmount('2000000')).toBe(2000000);
                expect(formatMidtransAmount('2000000.50')).toBe(2000001);
            });

            it('should throw error for invalid amounts', () => {
                expect(() => formatMidtransAmount(0)).toThrow('Invalid payment amount');
                expect(() => formatMidtransAmount(-1000)).toThrow('Invalid payment amount');
                expect(() => formatMidtransAmount(NaN)).toThrow('Invalid payment amount');
                expect(() => formatMidtransAmount('invalid')).toThrow('Invalid payment amount');
            });
        });

        describe('isPaymentExpired', () => {
            it('should not expire paid invoices', () => {
                const paidAt = new Date();
                const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
                
                expect(isPaymentExpired(paidAt, createdAt)).toBe(false);
            });

            it('should not expire recent unpaid invoices', () => {
                const paidAt = null;
                const createdAt = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
                
                expect(isPaymentExpired(paidAt, createdAt)).toBe(false);
            });

            it('should expire old unpaid invoices', () => {
                const paidAt = null;
                const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
                
                expect(isPaymentExpired(paidAt, createdAt)).toBe(true);
            });

            it('should handle exact expiry time', () => {
                const paidAt = null;
                const createdAt = new Date(Date.now() - PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000 - 1); // Just before 24 hours
                
                expect(isPaymentExpired(paidAt, createdAt)).toBe(true);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty user details', async () => {
            const mockChargeResponse = {
                status_code: '201',
                order_id: 'ORDER-123',
                gross_amount: '2000000',
                payment_type: 'qris',
                actions: [{
                    name: 'generate-qr-code',
                    method: 'GET',
                    url: 'https://qr.example.com',
                }],
            };

            mockCoreApi.charge.mockResolvedValue(mockChargeResponse);

            const service = createMidtransService(mockRuntime);
            const emptyUser = {
                id: 'user-123',
                email: '',
                name: '',
                phone: null,
            };

            await service.createQrisPayment(mockInvoice, emptyUser);

            expect(mockCoreApi.charge).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer_details: expect.objectContaining({
                        email: 'unknown@example.com',
                        first_name: 'Test',
                        last_name: 'Website',
                    }),
                })
            );
        });

        it('should handle project names with single word', async () => {
            const mockChargeResponse = {
                status_code: '201',
                order_id: 'ORDER-123',
                gross_amount: 2000000,
                payment_type: 'qris',
                actions: [{
                    name: 'generate-qr-code',
                    method: 'GET',
                    url: 'https://qr.example.com',
                }],
            };

            mockCoreApi.charge.mockResolvedValue(mockChargeResponse);

            const singleWordProject = {
                ...mockProject,
                name: 'SitusWeb',
            };

            const singleWordInvoice = {
                ...mockInvoice,
                project: singleWordProject,
            };

            const service = createMidtransService(mockRuntime);
            await service.createQrisPayment(singleWordInvoice, mockUser);

            expect(mockCoreApi.charge).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer_details: expect.objectContaining({
                        first_name: 'Test',
                        last_name: 'User',
                    }),
                    item_details: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'COMPANY - SitusWeb',
                        })
                    ]),
                })
            );
        });
    });
});