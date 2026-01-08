import { describe, it, expect } from 'vitest';
import {
  isInvoiceData,
  isCreateInvoiceRequestData,
  isPaymentResponseData,
  isInvoiceStatus,
  type InvoiceData,
  type CreateInvoiceRequestData,
  type PaymentResponseData,
  type InvoiceStatus
} from './invoice.schema';

describe('Invoice Schema Type Guards', () => {
  describe('isInvoiceData', () => {
    it('should identify valid invoice data', () => {
      const validInvoice: InvoiceData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        projectId: '987f6543-e21c-43d6-b987-543210987654',
        amount: 1500000,
        status: 'paid',
        midtransOrderId: 'ORDER-123',
        qrisUrl: 'https://example.com/qris',
        paidAt: '2025-01-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      };
      expect(isInvoiceData(validInvoice)).toBe(true);
    });

    it('should reject invalid invoice status', () => {
      const invalidInvoice = {
        id: '123',
        projectId: '456',
        amount: 1500000,
        status: 'invalid',
        createdAt: '2025-01-01T00:00:00Z'
      };
      expect(isInvoiceData(invalidInvoice)).toBe(false);
    });

    it('should reject invoice with invalid amount type', () => {
      const invalidInvoice = {
        id: '123',
        projectId: '456',
        amount: '1500000',
        status: 'paid',
        createdAt: '2025-01-01T00:00:00Z'
      };
      expect(isInvoiceData(invalidInvoice)).toBe(false);
    });

    it('should accept unpaid invoice without payment fields', () => {
      const validInvoice: InvoiceData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        projectId: '987f6543-e21c-43d6-b987-543210987654',
        amount: 1500000,
        status: 'unpaid',
        midtransOrderId: null,
        qrisUrl: null,
        paidAt: null,
        createdAt: '2025-01-01T00:00:00Z'
      };
      expect(isInvoiceData(validInvoice)).toBe(true);
    });
  });

  describe('isCreateInvoiceRequestData', () => {
    it('should identify valid create invoice request', () => {
      const validRequest: CreateInvoiceRequestData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 1500000
      };
      expect(isCreateInvoiceRequestData(validRequest)).toBe(true);
    });

    it('should reject request missing projectId', () => {
      const invalidRequest = {
        amount: 1500000
      };
      expect(isCreateInvoiceRequestData(invalidRequest)).toBe(false);
    });

    it('should reject request missing amount', () => {
      const invalidRequest = {
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };
      expect(isCreateInvoiceRequestData(invalidRequest)).toBe(false);
    });

    it('should reject request with non-numeric amount', () => {
      const invalidRequest = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        amount: '1500000'
      };
      expect(isCreateInvoiceRequestData(invalidRequest)).toBe(false);
    });
  });

  describe('isPaymentResponseData', () => {
    it('should identify valid payment response', () => {
      const validResponse: PaymentResponseData = {
        success: true,
        orderId: 'ORDER-123',
        qrisUrl: 'https://app.sandbox.midtrans.com/payment/...',
        grossAmount: 1500000,
        paymentType: 'qris',
        statusCode: '201',
        transactionId: 'TXN-123',
        message: 'Success, QRIS transaction is created'
      };
      expect(isPaymentResponseData(validResponse)).toBe(true);
    });

    it('should reject response missing required fields', () => {
      const invalidResponse = {
        success: true,
        orderId: 'ORDER-123',
        qrisUrl: 'https://example.com'
      };
      expect(isPaymentResponseData(invalidResponse)).toBe(false);
    });

    it('should accept response with null transactionId', () => {
      const validResponse: PaymentResponseData = {
        success: true,
        orderId: 'ORDER-123',
        qrisUrl: 'https://example.com/qris',
        grossAmount: 1500000,
        paymentType: 'qris',
        statusCode: '201',
        transactionId: null,
        message: 'Success'
      };
      expect(isPaymentResponseData(validResponse)).toBe(true);
    });
  });

  describe('isInvoiceStatus', () => {
    it('should accept unpaid status', () => {
      expect(isInvoiceStatus('unpaid')).toBe(true);
    });

    it('should accept paid status', () => {
      expect(isInvoiceStatus('paid')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isInvoiceStatus('pending')).toBe(false);
      expect(isInvoiceStatus('completed')).toBe(false);
      expect(isInvoiceStatus('')).toBe(false);
    });
  });

  describe('Schema Consistency', () => {
    it('should ensure invoice data matches all required fields', () => {
      const invoice: InvoiceData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        projectId: '987f6543-e21c-43d6-b987-543210987654',
        amount: 1500000,
        status: 'unpaid',
        midtransOrderId: null,
        qrisUrl: null,
        paidAt: null,
        createdAt: '2025-01-01T00:00:00Z'
      };

      expect(isInvoiceData(invoice)).toBe(true);
      expect(invoice).toHaveProperty('id');
      expect(invoice).toHaveProperty('projectId');
      expect(invoice).toHaveProperty('amount');
      expect(invoice).toHaveProperty('status');
      expect(invoice).toHaveProperty('midtransOrderId');
      expect(invoice).toHaveProperty('qrisUrl');
      expect(invoice).toHaveProperty('paidAt');
      expect(invoice).toHaveProperty('createdAt');
    });

    it('should validate invoice status enum values', () => {
      const validStatuses: InvoiceStatus[] = ['unpaid', 'paid'];
      validStatuses.forEach(status => {
        expect(isInvoiceStatus(status)).toBe(true);
      });
    });

    it('should ensure payment response has all required fields', () => {
      const payment: PaymentResponseData = {
        success: true,
        orderId: 'ORDER-123',
        qrisUrl: 'https://example.com/qris',
        grossAmount: 1500000,
        paymentType: 'qris',
        statusCode: '201',
        transactionId: 'TXN-123',
        message: 'Success'
      };

      expect(isPaymentResponseData(payment)).toBe(true);
      expect(payment).toHaveProperty('success');
      expect(payment).toHaveProperty('orderId');
      expect(payment).toHaveProperty('qrisUrl');
      expect(payment).toHaveProperty('grossAmount');
      expect(payment).toHaveProperty('paymentType');
      expect(payment).toHaveProperty('statusCode');
      expect(payment).toHaveProperty('transactionId');
      expect(payment).toHaveProperty('message');
    });
  });
});
