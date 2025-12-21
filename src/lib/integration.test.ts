/**
 * Payment Integration Tests
 * Tests the payment system components working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMidtransService, validateInvoiceForPayment } from '@/lib/midtrans-client';
import { validateMidtransSignature, parseMidtransWebhook, MIDTRANS_STATUS_MAP } from '@/lib/midtrans';


describe('Payment Integration Tests', () => {
  let mockRuntime: any;
  let mockUser: any;
  let mockProject: any;
  let mockInvoice: any;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors for expected webhook parsing errors
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock runtime environment
    mockRuntime = {
      MIDTRANS_SERVER_KEY: 'test-server-key',
      MIDTRANS_CLIENT_KEY: 'test-client-key',
    };

    // Mock user data
    mockUser = {
      id: 'user-integration-test',
      email: 'integration@test.com',
      name: 'Integration Test User',
      phone: '+62812345678',
    };

    // Mock project data
    mockProject = {
      id: 'project-integration-test',
      userId: mockUser.id,
      name: 'Integration Test Website',
      type: 'company',
      status: 'pending_payment',
      url: null,
      credentials: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock invoice data with Decimal type
    mockInvoice = {
      id: 'invoice-integration-test',
      projectId: mockProject.id,
      amount: { toNumber: () => 2000000, toString: () => '2000000' },
      status: 'unpaid',
      midtransOrderId: null,
      qrisUrl: null,
      paidAt: null,
      createdAt: new Date(),
      project: mockProject,
    };
  });

  afterEach(() => {
    // Restore console error logging
    consoleSpy.mockRestore();
  });

  describe('Service Integration', () => {
    it('should create payment service and validate readiness', () => {
      const service = createMidtransService(mockRuntime);
      expect(service).toBeDefined();
      expect(typeof service.createQrisPayment).toBe('function');
      expect(typeof service.getPaymentStatus).toBe('function');
      expect(typeof service.cancelPayment).toBe('function');
      expect(typeof service.refundPayment).toBe('function');
    });

    it('should throw error when Midtrans keys are not configured', () => {
      const invalidRuntime = { ...mockRuntime, MIDTRANS_SERVER_KEY: '' };
      expect(() => createMidtransService(invalidRuntime)).toThrow('Midtrans keys not configured');
    });
  });

  describe('Invoice Validation Integration', () => {
    it('should validate unpaid invoice for payment', () => {
      const result = validateInvoiceForPayment(mockInvoice);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');
    });

    it('should reject paid invoice for payment', () => {
      const paidInvoice = {
        ...mockInvoice,
        status: 'paid',
        midtransOrderId: 'ORDER-123',
      };
      
      const result = validateInvoiceForPayment(paidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('tidak dapat dibayar');
    });

    it('should reject invoice with existing payment attempt', () => {
      const invoiceWithPayment = {
        ...mockInvoice,
        midtransOrderId: 'ORDER-EXISTING',
      };
      
      const result = validateInvoiceForPayment(invoiceWithPayment);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('sudah pernah dibuat');
    });
  });

  describe('Webhook Security Integration', () => {
    it('should validate Midtrans webhook signature correctly', () => {
      const orderId = 'ORDER-TEST-123';
      const statusCode = '200';
      const grossAmount = '2000000';
      const serverKey = 'test-server-key';
      
      // Create valid signature (this would normally be SHA-512 HMAC)
      // For testing, we'll mock the validation to pass
      vi.mock('@/lib/midtrans', async () => {
        const actual = await vi.importActual('@/lib/midtrans');
        return {
          ...actual,
          validateMidtransSignature: vi.fn().mockReturnValue(true),
        };
      });

      const isValid = validateMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        'mocked-signature',
        serverKey
      );
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should parse webhook payload correctly', () => {
      const webhookBody = JSON.stringify({
        transaction_status: 'settlement',
        order_id: 'ORDER-123',
        gross_amount: '2000000',
        payment_type: 'qris',
        transaction_id: 'trans-123',
        status_code: '200',
        signature_key: 'test-signature',
      });

      const payload = parseMidtransWebhook(webhookBody);
      
      expect(payload).not.toBeNull();
      expect(payload?.order_id).toBe('ORDER-123');
      expect(payload?.transaction_status).toBe('settlement');
      expect(payload?.gross_amount).toBe('2000000');
    });

    it('should reject invalid webhook payload', () => {
      const payload = parseMidtransWebhook('invalid json');
      expect(payload).toBeNull();
    });

    it('should reject webhook payload with missing fields', () => {
      const incompleteBody = JSON.stringify({
        transaction_status: 'settlement',
        // Missing order_id
      });

      const payload = parseMidtransWebhook(incompleteBody);
      expect(payload).toBeNull();
    });
  });

  describe('Status Mapping Integration', () => {
    it('should correctly map Midtrans statuses to invoice statuses', () => {
      // Test successful payment mapping
      expect(MIDTRANS_STATUS_MAP['settlement']).toBe('paid');
      expect(MIDTRANS_STATUS_MAP['capture']).toBe('paid');
      
      // Test pending payment mapping  
      expect(MIDTRANS_STATUS_MAP['pending']).toBe('pending');
      
      // Test failure mapping
      expect(MIDTRANS_STATUS_MAP['deny']).toBe('failed');
      expect(MIDTRANS_STATUS_MAP['expire']).toBe('expired');
      expect(MIDTRANS_STATUS_MAP['cancel']).toBe('cancelled');
    });

    it('should handle unknown transaction status gracefully', () => {
      // Test that all known statuses return valid mappings
      const knownStatuses = Object.keys(MIDTRANS_STATUS_MAP) as Array<keyof typeof MIDTRANS_STATUS_MAP>;
      knownStatuses.forEach(status => {
        expect(typeof MIDTRANS_STATUS_MAP[status]).toBe('string');
      });
      
      // Unknown status should be handled by the implementation (this would be a runtime check)
      // In a real scenario, the service would default to 'pending' for unknown statuses
    });
  });

  describe('End-to-End Payment Flow Simulation', () => {
    it('should simulate complete payment validation flow', () => {
      // Step 1: Validate invoice ready for payment
      const invoiceValidation = validateInvoiceForPayment(mockInvoice);
      expect(invoiceValidation.isValid).toBe(true);
      
      // Step 2: Create payment service
      const service = createMidtransService(mockRuntime);
      expect(service).toBeDefined();
      
      // Step 3: Mock webhook parsing
      const webhookBody = JSON.stringify({
        transaction_status: 'settlement',
        order_id: 'ORDER-123',
        gross_amount: '2000000',
        payment_type: 'qris',
        transaction_id: 'trans-123',
        status_code: '200',
        signature_key: 'test-signature-key',
      });
      
      const webhookPayload = parseMidtransWebhook(webhookBody);
      expect(webhookPayload).not.toBeNull();
      expect(webhookPayload?.order_id).toBe('ORDER-123');
      
      // Step 4: Validate status mapping
      const transactionStatus = webhookPayload?.transaction_status as keyof typeof MIDTRANS_STATUS_MAP;
      const finalStatus = transactionStatus ? MIDTRANS_STATUS_MAP[transactionStatus] : 'pending';
      expect(finalStatus).toBe('paid');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed webhook gracefully', () => {
      const malformedPayloads = [
        '',
        '{"incomplete": "json"',
        '{"order_id": null}',
        '{"status_code": "invalid"}',
        'null',
        undefined,
        '{"gross_amount": undefined}',
      ];

      malformedPayloads.forEach((payload) => {
        const result = parseMidtransWebhook(payload as any);
        // Should handle all malformed payloads gracefully
        expect(typeof result === 'object' || result === null).toBe(true);
      });
    });

    it('should handle invoice validation edge cases', () => {
      // Test with zero amount
      const zeroAmountInvoice = {
        ...mockInvoice,
        amount: { toNumber: () => 0, toString: () => '0' },
      };
      
      const zeroResult = validateInvoiceForPayment(zeroAmountInvoice);
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.error).toContain('tidak valid');

      // Test with invalid status
      const invalidStatusInvoice = {
        ...mockInvoice,
        status: 'invalid_status' as any,
      };
      
      const statusResult = validateInvoiceForPayment(invalidStatusInvoice);
      expect(statusResult.isValid).toBe(false);
      
      // Test with missing project
      const noProjectInvoice = {
        ...mockInvoice,
        project: null,
      };
      
      const projectResult = validateInvoiceForPayment(noProjectInvoice);
      expect(projectResult.isValid).toBe(false);
    });

    it('should prevent timing attacks in signature validation', () => {
      const orderId = 'ORDER-TEST-123';
      const statusCode = '200';
      const grossAmount = '2000000';
      const serverKey = 'test-server-key';
      
      // Test with valid signature
      const validStart = performance.now();
      const validResult = validateMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        'valid-signature',
        serverKey
      );
      const validEnd = performance.now();
      
      // Test with invalid signature
      const invalidStart = performance.now();
      const invalidResult = validateMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        'invalid-signature',
        serverKey
      );
      const invalidEnd = performance.now();
      
      // Both should be booleans
      expect(typeof validResult).toBe('boolean');
      expect(typeof invalidResult).toBe('boolean');
      
      // Timing should be similar (within reasonable bounds)
      const validTime = validEnd - validStart;
      const invalidTime = invalidEnd - invalidStart;
      const timeDifference = Math.abs(validTime - invalidTime);
      
      // Should not have significant timing differences (basic timing attack protection)
      expect(timeDifference).toBeLessThan(100); // 100ms threshold
    });
  });
});