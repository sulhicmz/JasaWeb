import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { validateMidtransSignature, parseMidtransWebhook, MIDTRANS_STATUS_MAP } from '@/lib/midtrans';
import { createPrismaClient } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';

/**
 * Midtrans webhook endpoint for payment notifications
 * 
 * CRITICAL SECURITY: This endpoint validates webhook signatures before processing
 * any payment notifications. Never disable or bypass signature validation.
 * 
 * Rate limiting is intentionally NOT applied to webhook endpoints as they need
 * to handle payment notifications reliably without false negatives.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const prisma = createPrismaClient(locals.runtime.env);

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

    // CRITICAL: Validate webhook signature
    const serverKey = import.meta.env.MIDTRANS_SERVER_KEY;
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

    // Process valid webhook
    return await processPaymentNotification(prisma, payload);
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Processes validated payment notification
 * Implements idempotency - safe to retry the same notification
 */
async function processPaymentNotification(
  prisma: PrismaClient, 
  payload: any
) {
  const { order_id, transaction_status, gross_amount } = payload;
  
  // Map Midtrans status to our invoice status
  const mappedStatus = MIDTRANS_STATUS_MAP[transaction_status as keyof typeof MIDTRANS_STATUS_MAP];
  if (!mappedStatus) {
    console.warn(`Unknown transaction status: ${transaction_status} for order: ${order_id}`);
    return jsonResponse({ status: 'unknown_status_handled' });
  }

  // Find invoice by Midtrans order_id
  const invoice = await prisma.invoice.findFirst({
    where: { midtransOrderId: order_id },
    include: { project: true }
  });

  if (!invoice) {
    console.warn(`Invoice not found for order: ${order_id}`);
    return jsonResponse({ status: 'invoice_not_found' });
  }

  // Validate amount matches (prevent tampering)
  if (parseFloat(gross_amount) !== Number(invoice.amount)) {
    console.error(`Amount mismatch for order ${order_id}: expected ${invoice.amount}, got ${gross_amount}`);
    return errorResponse('Amount validation failed', 400);
  }

  // Update invoice status (idempotent operation)
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: {
        set: mappedStatus as any
      },
      paidAt: mappedStatus === 'paid' ? new Date() : invoice.paidAt
    }
  });

  // If payment is completed, update project status
  if (mappedStatus === 'paid' && invoice.project.status === 'pending_payment') {
    await prisma.project.update({
      where: { id: invoice.projectId },
      data: { status: 'in_progress' }
    });
  }

  // Log successful processing (audit trail)
  console.log(`Payment processed: order ${order_id}, status ${mappedStatus}, invoice ${invoice.id}`);

  return jsonResponse({
    status: 'success',
    order_id,
    invoice_id: invoice.id,
    new_status: mappedStatus
  });
}