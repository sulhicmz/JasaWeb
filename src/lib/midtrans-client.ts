/**
 * Midtrans Payment Service
 * Handles QRIS payment generation and order management with resilience patterns
 */

import { CoreApi } from 'midtrans-client';
import type { Project, Invoice } from '@prisma/client';
import type { PaymentResponse, RuntimeEnv } from '@/lib/types';
import {
    withResilience,
    ExternalServiceError,
    ExternalServiceErrorCode,
    ErrorSeverity,
    CircuitBreaker,
    type ResilienceConfig,
} from '@/lib/resilience';

/**
 * Midtrans service interface
 */
export interface MidtransService {
    createQrisPayment(invoice: Invoice & { project: Project }, userDetails?: { email: string; name: string; phone?: string | null }): Promise<PaymentResponse>;
    getPaymentStatus(orderId: string): Promise<Record<string, unknown>>;
    cancelPayment(orderId: string): Promise<Record<string, unknown>>;
    refundPayment(orderId: string, amount?: number): Promise<Record<string, unknown>>;
}

/**
 * Creates Midtrans client with proper Cloudflare environment handling
 * 
 * CRITICAL: Always use runtime.env for secrets in Cloudflare Workers
 * NEVER use import.meta.env for secrets in production
 */
function createMidtransClient(runtime: RuntimeEnv): CoreApi {
    const isProduction = runtime.MIDTRANS_IS_PRODUCTION === 'true';
    const serverKey = runtime.MIDTRANS_SERVER_KEY;
    const clientKey = runtime.MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
        throw new ExternalServiceError(
            'Midtrans keys not configured',
            ExternalServiceErrorCode.AUTHENTICATION_FAILED,
            ErrorSeverity.CRITICAL,
            undefined,
            false
        );
    }

    return new CoreApi({
        isProduction,
        serverKey,
        clientKey,
    });
}

/**
 * Circuit breaker instances for Midtrans operations
 */
const midtransCircuitBreakers = {
    charge: new CircuitBreaker('midtrans-charge', {
        failureThreshold: 5,
        successThreshold: 3,
        timeoutMs: 60000,
        rollingWindowMs: 300000,
        minimumCalls: 5,
    }),
    status: new CircuitBreaker('midtrans-status', {
        failureThreshold: 5,
        successThreshold: 3,
        timeoutMs: 60000,
        rollingWindowMs: 300000,
        minimumCalls: 5,
    }),
    cancel: new CircuitBreaker('midtrans-cancel', {
        failureThreshold: 3,
        successThreshold: 2,
        timeoutMs: 60000,
        rollingWindowMs: 300000,
        minimumCalls: 3,
    }),
    refund: new CircuitBreaker('midtrans-refund', {
        failureThreshold: 3,
        successThreshold: 2,
        timeoutMs: 60000,
        rollingWindowMs: 300000,
        minimumCalls: 3,
    }),
};

/**
 * QRIS Payment Implementation
 */
export class MidtransPaymentService implements MidtransService {
    private midtransClient: CoreApi & {
        transaction: {
            status(transactionId: string): Promise<Record<string, unknown>>;
            cancel(transactionId: string): Promise<Record<string, unknown>>;
            refund(transactionId: string, parameter?: Record<string, unknown>): Promise<Record<string, unknown>>;
            approve(transactionId: string): Promise<Record<string, unknown>>;
            deny(transactionId: string): Promise<Record<string, unknown>>;
            expire(transactionId: string): Promise<Record<string, unknown>>;
        };
    };

    constructor(runtime: RuntimeEnv) {
        this.midtransClient = createMidtransClient(runtime) as CoreApi & {
            transaction: {
                status(transactionId: string): Promise<Record<string, unknown>>;
                cancel(transactionId: string): Promise<Record<string, unknown>>;
                refund(transactionId: string, parameter?: Record<string, unknown>): Promise<Record<string, unknown>>;
                approve(transactionId: string): Promise<Record<string, unknown>>;
                deny(transactionId: string): Promise<Record<string, unknown>>;
                expire(transactionId: string): Promise<Record<string, unknown>>;
            }
        };
    }

    /**
     * Creates QRIS payment for an invoice with resilience patterns
     * 
     * @param invoice - Invoice with project details
     * @param userDetails - Optional user details for customer information
     * @returns Payment response with QRIS URL and order details
     */
    async createQrisPayment(
        invoice: Invoice & { project: Project }, 
        userDetails?: { email: string; name: string; phone?: string | null }
    ): Promise<PaymentResponse> {
        const resilienceConfig: ResilienceConfig = {
            circuitBreaker: midtransCircuitBreakers.charge,
            timeout: {
                timeoutMs: 15000, // 15 second timeout for payment creation
            },
            retry: {
                maxRetries: 3,
                initialDelayMs: 1000,
                maxDelayMs: 10000,
                backoffMultiplier: 2,
                jitter: true,
            },
            enableLogging: true,
        };

        return withResilience(
            async () => {
                try {
                    const chargeResponse = await this.executeCharge(invoice, userDetails);

                    if (!chargeResponse || !chargeResponse.status_code) {
                        throw new ExternalServiceError(
                            'Invalid payment response from Midtrans',
                            ExternalServiceErrorCode.INVALID_RESPONSE,
                            ErrorSeverity.HIGH,
                            undefined,
                            false
                        );
                    }

                    if (!chargeResponse.actions || !chargeResponse.actions[0]?.url) {
                        throw new ExternalServiceError(
                            'QRIS URL not found in payment response',
                            ExternalServiceErrorCode.INVALID_RESPONSE,
                            ErrorSeverity.HIGH,
                            undefined,
                            false
                        );
                    }

                    const orderId = chargeResponse.order_id || `INV-${invoice.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

                    return {
                        success: chargeResponse.status_code === '201',
                        orderId,
                        qrisUrl: chargeResponse.actions[0].url,
                        grossAmount: chargeResponse.gross_amount || Number(invoice.amount),
                        paymentType: chargeResponse.payment_type,
                        statusCode: chargeResponse.status_code,
                        transactionId: chargeResponse.transaction_id,
                        message: chargeResponse.status_message || 'Payment created successfully',
                    };
                } catch (error) {
                    if (error instanceof ExternalServiceError) {
                        throw error;
                    }

                    console.error('QRIS payment creation failed:', {
                        invoiceId: invoice.id,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });

                    throw new ExternalServiceError(
                        `Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        ExternalServiceErrorCode.UNKNOWN,
                        ErrorSeverity.HIGH,
                        error,
                        true
                    );
                }
            },
            'midtrans',
            'createQrisPayment',
            resilienceConfig
        );
    }

    /**
     * Execute charge operation (internal method)
     */
    private async executeCharge(
        invoice: Invoice & { project: Project }, 
        userDetails?: { email: string; name: string; phone?: string | null }
    ) {
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
                acquirer: 'gopay',
            },
            custom_field1: invoice.projectId,
            custom_field2: invoice.id,
        };

        return await this.midtransClient.charge(parameter);
    }

    /**
     * Gets payment status from Midtrans with resilience patterns
     * 
     * @param orderId - Midtrans order ID
     * @returns Transaction status from Midtrans
     */
    async getPaymentStatus(orderId: string) {
        const resilienceConfig: ResilienceConfig = {
            circuitBreaker: midtransCircuitBreakers.status,
            timeout: {
                timeoutMs: 10000, // 10 second timeout for status check
            },
            retry: {
                maxRetries: 2, // Fewer retries for status checks
                initialDelayMs: 500,
                maxDelayMs: 5000,
                backoffMultiplier: 2,
                jitter: true,
            },
            enableLogging: true,
        };

        return withResilience(
            async () => {
                try {
                    const status = await this.midtransClient.transaction.status(orderId);
                    return status;
                } catch (error) {
                    console.error('Payment status check failed:', {
                        orderId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });

                    throw new ExternalServiceError(
                        `Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        ExternalServiceErrorCode.UNKNOWN,
                        ErrorSeverity.MEDIUM,
                        error,
                        true
                    );
                }
            },
            'midtrans',
            'getPaymentStatus',
            resilienceConfig
        );
    }

    /**
     * Cancels a pending payment with resilience patterns
     * 
     * @param orderId - Midtrans order ID
     * @returns Cancellation response
     */
    async cancelPayment(orderId: string) {
        const resilienceConfig: ResilienceConfig = {
            circuitBreaker: midtransCircuitBreakers.cancel,
            timeout: {
                timeoutMs: 15000,
            },
            retry: {
                maxRetries: 2,
                initialDelayMs: 1000,
                maxDelayMs: 8000,
                backoffMultiplier: 2,
                jitter: true,
            },
            enableLogging: true,
        };

        return withResilience(
            async () => {
                try {
                    const response = await this.midtransClient.transaction.cancel(orderId);
                    return response;
                } catch (error) {
                    console.error('Payment cancellation failed:', {
                        orderId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });

                    throw new ExternalServiceError(
                        `Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        ExternalServiceErrorCode.UNKNOWN,
                        ErrorSeverity.MEDIUM,
                        error,
                        true
                    );
                }
            },
            'midtrans',
            'cancelPayment',
            resilienceConfig
        );
    }

    /**
     * Refunds a paid transaction with resilience patterns
     * 
     * @param orderId - Midtrans order ID
     * @param amount - Amount to refund (optional, defaults to full amount)
     * @returns Refund response
     */
    async refundPayment(orderId: string, amount?: number) {
        const resilienceConfig: ResilienceConfig = {
            circuitBreaker: midtransCircuitBreakers.refund,
            timeout: {
                timeoutMs: 20000,
            },
            retry: {
                maxRetries: 3,
                initialDelayMs: 1500,
                maxDelayMs: 12000,
                backoffMultiplier: 2,
                jitter: true,
            },
            enableLogging: true,
        };

        return withResilience(
            async () => {
                try {
                    const parameter: Record<string, unknown> = {};
                    if (amount) {
                        parameter.amount = amount;
                    }

                    const response = await this.midtransClient.transaction.refund(orderId, parameter);
                    return response;
                } catch (error) {
                    console.error('Payment refund failed:', {
                        orderId,
                        amount,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });

                    throw new ExternalServiceError(
                        `Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        ExternalServiceErrorCode.UNKNOWN,
                        ErrorSeverity.HIGH,
                        error,
                        true
                    );
                }
            },
            'midtrans',
            'refundPayment',
            resilienceConfig
        );
    }
}

/**
 * Factory function to create Midtrans service
 */
export function createMidtransService(runtime: RuntimeEnv): MidtransService {
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