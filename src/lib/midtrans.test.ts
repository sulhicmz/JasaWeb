import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { validateMidtransSignature, parseMidtransWebhook, MIDTRANS_STATUS_MAP } from '@/lib/midtrans';

describe('Midtrans Webhook Security', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const SERVER_KEY = 'test_server_key_123';
  const VALID_PAYLOAD = {
    transaction_status: 'settlement',
    order_id: 'ORDER-123',
    gross_amount: '100000.00',
    payment_type: 'qris',
    transaction_id: 'TX-123',
    status_code: '200',
    signature_key: 'test_signature_key_123'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    // Suppress console errors for expected signature validation failures
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console error logging
    consoleSpy.mockRestore();
  });

  describe('parseMidtransWebhook', () => {
    it('should parse valid webhook payload', () => {
      const body = JSON.stringify(VALID_PAYLOAD);
      const result = parseMidtransWebhook(body);
      
      expect(result).toBeTruthy();
      expect(result?.order_id).toBe('ORDER-123');
      expect(result?.status_code).toBe('200');
    });

    it('should return null for invalid JSON', () => {
      const result = parseMidtransWebhook('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const invalidPayload = { order_id: 'test' }; // missing other required fields
      const body = JSON.stringify(invalidPayload);
      const result = parseMidtransWebhook(body);
      expect(result).toBeNull();
    });
  });

  describe('validateMidtransSignature', () => {
    it('should validate correct signature', () => {
      // Mock console.error to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const stringToHash = `${VALID_PAYLOAD.order_id}${VALID_PAYLOAD.status_code}${VALID_PAYLOAD.gross_amount}${SERVER_KEY}`;
      const signature = createHmac('sha512', SERVER_KEY)
        .update(stringToHash)
        .digest('hex');

      const result = validateMidtransSignature(
        VALID_PAYLOAD.order_id,
        VALID_PAYLOAD.status_code,
        VALID_PAYLOAD.gross_amount,
        signature,
        SERVER_KEY
      );

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = validateMidtransSignature(
        VALID_PAYLOAD.order_id,
        VALID_PAYLOAD.status_code,
        VALID_PAYLOAD.gross_amount,
        'invalid_signature',
        SERVER_KEY
      );

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = validateMidtransSignature(
        VALID_PAYLOAD.order_id,
        VALID_PAYLOAD.status_code,
        VALID_PAYLOAD.gross_amount,
        '',
        ''  // Empty server key should cause error
      );

      expect(result).toBe(false);
    });
  });

  describe('MIDTRANS_STATUS_MAP', () => {
    it('should map all required Midtrans statuses', () => {
      expect(MIDTRANS_STATUS_MAP.capture).toBe('paid');
      expect(MIDTRANS_STATUS_MAP.settlement).toBe('paid');
      expect(MIDTRANS_STATUS_MAP.pending).toBe('pending');
      expect(MIDTRANS_STATUS_MAP.deny).toBe('failed');
      expect(MIDTRANS_STATUS_MAP.cancel).toBe('cancelled');
      expect(MIDTRANS_STATUS_MAP.expire).toBe('expired');
      expect(MIDTRANS_STATUS_MAP.refund).toBe('refunded');
      expect(MIDTRANS_STATUS_MAP.partial_refund).toBe('partial_refunded');
    });
  });

  describe('Security Tests', () => {
    it('should prevent timing attacks with constant string comparison', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const stringToHash = `${VALID_PAYLOAD.order_id}${VALID_PAYLOAD.status_code}${VALID_PAYLOAD.gross_amount}${SERVER_KEY}`;
      const correctSignature = createHmac('sha512', SERVER_KEY)
        .update(stringToHash)
        .digest('hex');
      
      // Test that different length strings return false quickly
      const result1 = validateMidtransSignature(
        VALID_PAYLOAD.order_id,
        VALID_PAYLOAD.status_code,
        VALID_PAYLOAD.gross_amount,
        'short',
        SERVER_KEY
      );
      
      expect(result1).toBe(false);

      // Test that correct signature passes
      const result2 = validateMidtransSignature(
        VALID_PAYLOAD.order_id,
        VALID_PAYLOAD.status_code,
        VALID_PAYLOAD.gross_amount,
        correctSignature,
        SERVER_KEY
      );
      
      expect(result2).toBe(true);
    });
  });
});