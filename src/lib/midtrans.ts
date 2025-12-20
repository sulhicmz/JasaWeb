import { createHmac } from 'crypto';

/**
 * Midtrans webhook signature validation
 * CRITICAL: Never process webhook data without cryptographic verification
 */

export interface MidtransWebhookPayload {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_id: string;
  fraud_status?: string;
  status_code: string;
  signature_key: string;
}

/**
 * Validates Midtrans webhook signature using SHA-512 HMAC
 * 
 * @param payload - The raw webhook payload from Midtrans
 * @param signatureKey - The signature key from the payload
 * @param serverKey - Your Midtrans server key from environment
 * @returns boolean - true if signature is valid, false otherwise
 */
export function validateMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string
): boolean {
  try {
    // Create the string to hash: orderId + statusCode + grossAmount + serverKey
    const stringToHash = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    
    // Generate SHA-512 HMAC
    const expectedSignature = createHmac('sha512', serverKey)
      .update(stringToHash)
      .digest('hex');
    
    // Secure comparison to prevent timing attacks
    return constantTimeStringCompare(signatureKey, expectedSignature);
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeStringCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extracts required fields for signature calculation from webhook body
 */
export function parseMidtransWebhook(body: string): MidtransWebhookPayload | null {
  try {
    const payload = JSON.parse(body) as MidtransWebhookPayload;
    
    // Validate required fields
    const required = ['order_id', 'status_code', 'gross_amount', 'signature_key'];
    for (const field of required) {
      if (!payload[field as keyof MidtransWebhookPayload]) {
        console.error(`Missing required field: ${field}`);
        return null;
      }
    }

    return payload;
  } catch (error) {
    console.error('Failed to parse webhook payload:', error);
    return null;
  }
}

/**
 * Webhook transaction status mapping
 */
export const MIDTRANS_STATUS_MAP = {
  'capture': 'paid',
  'settlement': 'paid', 
  'pending': 'pending',
  'deny': 'failed',
  'cancel': 'cancelled',
  'expire': 'expired',
  'refund': 'refunded',
  'partial_refund': 'partial_refunded'
} as const;

export type MidtransStatus = keyof typeof MIDTRANS_STATUS_MAP;
export type InvoiceStatus = typeof MIDTRANS_STATUS_MAP[MidtransStatus];