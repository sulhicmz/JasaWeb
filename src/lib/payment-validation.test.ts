/**
 * Payment API Tests
 * Integration tests for payment endpoints
 */

import { describe, it, expect } from 'vitest';
import { validateInvoiceForPayment, formatMidtransAmount, isPaymentExpired } from '@/lib/midtrans-client';
import type { Invoice, Project } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('Payment Validation Utilities', () => {
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
            expect(result.error).toContain('tidak dapat dibayar');
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
    });
});

describe('Payment Integration', () => {
    it('should import payment service successfully', async () => {
        await expect(import('@/lib/midtrans-client')).resolves.toBeDefined();
    });

    it('should have payment service types defined', async () => {
        const paymentModule = await import('@/lib/midtrans-client');
        expect(typeof paymentModule.createMidtransService).toBe('function');
    });
});