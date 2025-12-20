/**
 * Midtrans Payment Service
 * Handles QRIS payment generation and order management
 */

import { CoreApi } from 'midtrans-client';
import type { Project, Invoice } from '@prisma/client';
import type { PaymentResponse } from '@/lib/types';

/**
 * Midtrans service interface
 */
export interface MidtransService {
    createQrisPayment(invoice: Invoice & { project: Project }, userDetails?: { email: string; name: string; phone?: string | null }): Promise<PaymentResponse>;
    getPaymentStatus(orderId: string): Promise<any>;
    cancelPayment(orderId: string): Promise<any>;
    refundPayment(orderId: string, amount?: number): Promise<any>;
}

/**
 * Creates Midtrans client with proper Cloudflare environment handling
 * 
 * CRITICAL: Always use runtime.env for secrets in Cloudflare Workers
 * NEVER use import.meta.env for secrets in production
 */
function createMidtransClient(runtime?: any): CoreApi {
    const isProduction = runtime?.MIDTRANS_IS_PRODUCTION === 'true' || 
                        import.meta.env.MIDTRANS_IS_PRODUCTION === 'true';
    
    const serverKey = runtime?.MIDTRANS_SERVER_KEY || import.meta.env.MIDTRANS_SERVER_KEY;
    const clientKey = runtime?.MIDTRANS_CLIENT_KEY || import.meta.env.MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
        throw new Error('Midtrans keys not configured');
    }

    return new CoreApi({
        isProduction,
        serverKey,
        clientKey,
    });
}

/**
 * QRIS Payment Implementation
 */
export class MidtransPaymentService implements MidtransService {
    private midtransClient: CoreApi & {
        transaction: {
            status(transactionId: string): Promise<any>;
            cancel(transactionId: string): Promise<any>;
            refund(transactionId: string, parameter?: any): Promise<any>;
            approve(transactionId: string): Promise<any>;
            deny(transactionId: string): Promise<any>;
            expire(transactionId: string): Promise<any>;
        };
    };

    constructor(runtime?: any) {
        this.midtransClient = createMidtransClient(runtime) as any;
    }

    /**
     * Creates QRIS payment for an invoice
     * 
     * @param invoice - Invoice with project details
     * @param userDetails - Optional user details for customer information
     * @returns Payment response with QRIS URL and order details
     */
    async createQrisPayment(
        invoice: Invoice & { project: Project }, 
        userDetails?: { email: string; name: string; phone?: string | null }
    ): Promise<PaymentResponse> {
        try {
            // Generate unique order ID with invoice prefix for easier tracking
            const orderId = `INV-${invoice.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

            const parameter = {
                payment_type: 'qris',
                transaction_details: {
                    order_id: orderId,
                    gross_amount: Number(invoice.amount),
                },
                customer_details: {
                    email: userDetails?.email || 'unknown@example.com',
                    first_name: userDetails?.name?.split(' ')[0] || invoice.project.name.split(' ')[0],
                    last_name: userDetails?.name?.split(' ').slice(1).join(' ') || invoice.project.name.split(' ').slice(1).join(' ') || '',
                    phone: userDetails?.phone,
                },
                item_details: [{
                    id: invoice.project.id,
                    name: `${invoice.project.type.toUpperCase()} - ${invoice.project.name}`,
                    price: Number(invoice.amount),
                    quantity: 1,
                    category: invoice.project.type,
                }],
                qris: {
                    acquirer: 'gopay', // Use GoPay as QRIS acquirer
                },
                custom_field1: invoice.projectId, // Store project reference
                custom_field2: invoice.id, // Store invoice reference
            };

            // Create transaction with Midtrans
            const chargeResponse = await this.midtransClient.charge(parameter);

            if (!chargeResponse || !chargeResponse.status_code) {
                throw new Error('Invalid payment response from Midtrans');
            }

            // Validate response contains QRIS URL
            if (!chargeResponse.actions || !chargeResponse.actions[0]?.url) {
                throw new Error('QRIS URL not found in payment response');
            }

            return {
                success: chargeResponse.status_code === '201',
                orderId: chargeResponse.order_id || orderId,
                qrisUrl: chargeResponse.actions[0].url,
                grossAmount: chargeResponse.gross_amount || Number(invoice.amount),
                paymentType: chargeResponse.payment_type,
                statusCode: chargeResponse.status_code,
                transactionId: chargeResponse.transaction_id,
                message: chargeResponse.status_message || 'Payment created successfully',
            };

        } catch (error) {
            console.error('QRIS payment creation failed:', {
                invoiceId: invoice.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            throw new Error(`Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets payment status from Midtrans
     * 
     * @param orderId - Midtrans order ID
     * @returns Transaction status from Midtrans
     */
    async getPaymentStatus(orderId: string) {
        try {
            const status = await this.midtransClient.transaction.status(orderId);
            return status;
        } catch (error) {
            console.error('Payment status check failed:', error);
            throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Cancels a pending payment
     * 
     * @param orderId - Midtrans order ID
     * @returns Cancellation response
     */
    async cancelPayment(orderId: string) {
        try {
            const response = await this.midtransClient.transaction.cancel(orderId);
            return response;
        } catch (error) {
            console.error('Payment cancellation failed:', error);
            throw new Error(`Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Refunds a paid transaction
     * 
     * @param orderId - Midtrans order ID
     * @param amount - Amount to refund (optional, defaults to full amount)
     * @returns Refund response
     */
    async refundPayment(orderId: string, amount?: number) {
        try {
            const parameter: any = {};
            if (amount) {
                parameter.amount = amount;
            }

            const response = await this.midtransClient.transaction.refund(orderId, parameter);
            return response;
        } catch (error) {
            console.error('Payment refund failed:', error);
            throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

/**
 * Factory function to create Midtrans service
 */
export function createMidtransService(runtime?: any): MidtransService {
    return new MidtransPaymentService(runtime);
}

/**
 * Validates invoice is ready for payment
 */
export function validateInvoiceForPayment(
    invoice: Invoice & { project: Project }
): { isValid: boolean; error: string } {
    // Check invoice status
    if (invoice.status !== 'unpaid') {
        return {
            isValid: false,
            error: `Invoice tidak dapat dibayar. Status saat ini: ${invoice.status}`,
        };
    }

    // Check amount is valid
    if (Number(invoice.amount) <= 0) {
        return {
            isValid: false,
            error: 'Invoice amount tidak valid',
        };
    }

    // Check if project exists
    if (!invoice.project) {
        return {
            isValid: false,
            error: 'Project tidak ditemukan',
        };
    }

    // Prevent duplicate payments
    if (invoice.midtransOrderId) {
        return {
            isValid: false,
            error: 'Pembayaran sudah pernah dibuat. Gunakan QRIS yang sudah ada atau hubungi admin.',
        };
    }

    return { isValid: true, error: '' };
}

/**
 * Payment expiration helper
 */
export const PAYMENT_EXPIRY_HOURS = 24;

export function isPaymentExpired(paidAt: Date | null, createdAt: Date): boolean {
    if (paidAt) return false; // Already paid

    const expiryTime = new Date(createdAt.getTime() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
    return new Date() > expiryTime;
}

/**
 * Format payment amount for Midtrans (must be integer)
 */
export function formatMidtransAmount(amount: number | string): number {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num) || num <= 0) {
        throw new Error('Invalid payment amount');
    }

    // Midtrans requires integer amounts (no decimals for IDR)
    return Math.round(num);
}