import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { validateMidtransSignature, parseMidtransWebhook, MIDTRANS_STATUS_MAP } from '@/lib/midtrans';
import { getPrisma } from '@/lib/prisma';
import { WebhookQueueService } from '@/services/webhook-queue.service';

/**
 * Midtrans webhook endpoint for payment notifications
 * 
 * RELIABILITY ENHANCEMENT: This endpoint now enqueues webhooks for
 * reliable asynchronous processing with automatic retries.
 * 
 * CRITICAL SECURITY: This endpoint validates webhook signatures before enqueuing
 * any payment notifications. Never disable or bypass signature validation.
 * 
 * Rate limiting is intentionally NOT applied to webhook endpoints as they need
 * to handle payment notifications reliably without false negatives.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const prisma = getPrisma(locals) as ReturnType<typeof getPrisma> & { webhookQueue: unknown };
  const webhookQueueService = new WebhookQueueService(prisma as any);

  try {
    // Get raw body for signature validation
    const body = await request.text();
    
    if (!body) {
      return errorResponse('Empty webhook payload', 400);
    }

    // Parse webhook payload
    const payload = parseMidtransWebhook(body);
    if (!payload) {
      return errorResponse('Invalid webhook payload format', 400);
    }

    // CRITICAL: Validate webhook signature using secure environment access
    const serverKey = locals.runtime.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('CRITICAL: MIDTRANS_SERVER_KEY not configured');
      return errorResponse('Payment service unavailable', 503);
    }

    const isValidSignature = validateMidtransSignature(
      payload.order_id,
      payload.status_code,
      payload.gross_amount,
      payload.signature_key,
      serverKey
    );

    if (!isValidSignature) {
      console.warn(`Invalid webhook signature for order: ${payload.order_id}`);
      return errorResponse('Invalid signature', 401);
    }

    // Enqueue webhook for reliable processing
    await webhookQueueService.enqueueWithDeduplication({
      provider: 'midtrans',
      eventType: 'payment_notification',
      payload: {
        order_id: payload.order_id,
        transaction_status: payload.transaction_status,
        status_code: payload.status_code,
        gross_amount: payload.gross_amount,
        signature_key: payload.signature_key,
      },
      signature: payload.signature_key,
      eventId: payload.order_id,
      maxRetries: 5,
      ttlSeconds: 60 * 60 * 24, // 24 hours
    });

    // Return immediate success - processing happens asynchronously
    return jsonResponse({
      status: 'queued',
      message: 'Webhook enqueued for processing',
      order_id: payload.order_id,
    });
    
  } catch (error) {
    console.error('Webhook enqueue error:', error);
    return handleApiError(error);
  }
};

/**
 * Process a single webhook from the queue
 * This function is called by the background job processor
 */
export async function processMidtransWebhook(
  prisma: ReturnType<typeof getPrisma>,
  webhook: { payload: Record<string, unknown> }
): Promise<void> {
  const payload = webhook.payload as {
    order_id: string;
    transaction_status: string;
    gross_amount: string;
    signature_key: string;
  };

  const { order_id, transaction_status, gross_amount } = payload;
  
  // Map Midtrans status to our invoice status
  const mappedStatus = MIDTRANS_STATUS_MAP[transaction_status as keyof typeof MIDTRANS_STATUS_MAP];
  if (!mappedStatus) {
    console.warn(`Unknown transaction status: ${transaction_status} for order: ${order_id}`);
    return;
  }

  // Find invoice by Midtrans order_id
  const invoice = await prisma.invoice.findFirst({
    where: { midtransOrderId: order_id },
    include: { project: true }
  });

  if (!invoice) {
    console.warn(`Invoice not found for order: ${order_id}`);
    return;
  }

  // Validate amount matches (prevent tampering)
  if (parseFloat(gross_amount) !== Number(invoice.amount)) {
    console.error(`Amount mismatch for order ${order_id}: expected ${invoice.amount}, got ${gross_amount}`);
    throw new Error('Amount validation failed');
  }

  // Update invoice status (idempotent operation)
  const oldStatus = invoice.status;
  const oldProjectStatus = invoice.project.status;
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: mappedStatus,
      paidAt: mappedStatus === 'paid' ? new Date() : invoice.paidAt
    }
  });

  let newProjectStatus = oldProjectStatus;
  // If payment is completed, update project status
  if (mappedStatus === 'paid' && invoice.project.status === 'pending_payment') {
    await prisma.project.update({
      where: { id: invoice.projectId },
      data: { status: 'in_progress' }
    });
    newProjectStatus = 'in_progress';
  }

  // Log successful processing with detailed audit trail
  try {
    // Note: Audit logging in background processing has limited request context
    console.info('Payment webhook processed', {
      invoiceId: invoice.id,
      oldStatus,
      newStatus: mappedStatus,
      oldProjectStatus,
      newProjectStatus,
    });
  } catch (auditError) {
    console.error('Failed to log payment audit:', auditError);
    // Don't fail webhook if audit logging fails
  }
}
