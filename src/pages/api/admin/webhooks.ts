import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { getPrisma } from '@/lib/prisma';
import { WebhookQueueService } from '@/services/webhook-queue.service';

/**
 * Webhook monitoring endpoint
 * Provides statistics and management capabilities for webhook queue
 */
export const GET: APIRoute = async ({ locals }) => {
  const prisma = getPrisma(locals);
  const webhookQueueService = new WebhookQueueService(prisma as any);

  try {
    const stats = await webhookQueueService.getStats();

    return jsonResponse({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Retry failed webhooks
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const prisma = getPrisma(locals);
  const webhookQueueService = new WebhookQueueService(prisma as any);

  try {
    const body = await request.json();
    const { webhookIds } = body as { webhookIds?: string[] };

    if (!webhookIds || !Array.isArray(webhookIds)) {
      return errorResponse('webhookIds array is required', 400);
    }

    if (webhookIds.length === 0) {
      return errorResponse('webhookIds array cannot be empty', 400);
    }

    const retried = await webhookQueueService.retryFailedWebhooks(webhookIds);

    return jsonResponse({
      retried,
      message: `Retried ${retried} webhooks`,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
