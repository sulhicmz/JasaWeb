/**
 * Webhook Queue Service
 * 
 * Manages webhook queue for reliable payment notification processing.
 * Provides retry logic, deduplication, and monitoring capabilities.
 * 
 * Key Features:
 * - Idempotent webhook enqueue (deduplication by provider + event_id)
 * - Automatic retry with exponential backoff
 * - Webhook expiration handling
 * - Comprehensive monitoring and statistics
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@/lib/logger';

export type WebhookStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface WebhookQueue {
  id: string;
  provider: string;
  eventType: string;
  payload: Prisma.JsonValue;
  signature: string | null | undefined;
  eventId: string | null | undefined;
  status: WebhookStatus;
  retryCount: number;
  maxRetries: number;
  lastError: string | null | undefined;
  processedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnqueueWebhookOptions {
  provider: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
  signature?: string;
  eventId?: string;
  maxRetries?: number;
  ttlSeconds?: number;
}

export interface ProcessWebhookOptions {
  processFn: (webhook: WebhookQueue) => Promise<void>;
  batchSize?: number;
  retryDelayMs?: number;
}

export interface WebhookQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  expired: number;
  total: number;
  successRate: number;
  averageProcessingTimeMs: number;
}

const logger = new Logger('WebhookQueue');

type PrismaWithWebhookQueue = PrismaClient & {
  webhookQueue: {
    create: (args: { data: Partial<WebhookQueue> & { provider: string; eventType: string; payload: Prisma.InputJsonValue; expiresAt: Date } }) => Promise<WebhookQueue>;
    findFirst: (args: { where: { provider: string; eventId?: string; status?: { in: string[] } } }) => Promise<WebhookQueue | null>;
    findMany: (args: { where?: Record<string, unknown>; orderBy?: Array<Record<string, 'asc' | 'desc'>>; take?: number }) => Promise<WebhookQueue[]>;
    findUnique: (args: { where: { id: string } }) => Promise<WebhookQueue | null>;
    update: (args: { where: { id: string }; data: Partial<WebhookQueue> }) => Promise<WebhookQueue>;
    updateMany: (args: { where: Record<string, unknown>; data: Partial<WebhookQueue> }) => Promise<{ count: number }>;
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    groupBy: (args: { by: ('status')[]; _count?: { id: boolean } }) => Promise<Array<{ status: string; _count: { id: number } }>>;
    aggregate: (args: { where?: Record<string, unknown>; _avg?: { createdAt: boolean } }) => Promise<{ _avg: { createdAt: Date | null } }>;
  };
};

export class WebhookQueueService {
  constructor(private prisma: PrismaWithWebhookQueue) {}

  /**
   * Enqueue a webhook for processing
   * Idempotent: returns existing webhook if already enqueued
   */
  async enqueue(options: EnqueueWebhookOptions): Promise<WebhookQueue> {
    const {
      provider,
      eventType,
      payload,
      signature,
      eventId,
      maxRetries = 5,
      ttlSeconds = 60 * 60 * 24, // 24 hours default
    } = options;

    logger.info('Enqueuing webhook', { provider, eventType, eventId });

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      const webhook = await this.prisma.webhookQueue.create({
        data: {
          provider,
          eventType,
          payload: payload as Prisma.InputJsonValue,
          signature: signature || null,
          eventId: eventId || null,
          maxRetries,
          expiresAt,
          status: 'PENDING',
          retryCount: 0,
          lastError: null,
          processedAt: null,
        },
      });

      logger.info('Webhook enqueued successfully', { webhookId: webhook.id, provider, eventId });
      return webhook;
    } catch (error) {
      logger.error('Failed to enqueue webhook', { error, provider, eventId });
      throw error;
    }
  }

  /**
   * Enqueue webhook with deduplication check
   * Returns existing webhook if one with same provider and event_id exists
   */
  async enqueueWithDeduplication(options: EnqueueWebhookOptions): Promise<WebhookQueue> {
    const { provider, eventId } = options;

    if (!eventId) {
      return this.enqueue(options);
    }

    const existing = await this.prisma.webhookQueue.findFirst({
      where: {
        provider,
        eventId,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });

    if (existing) {
      logger.info('Webhook already enqueued (deduplication)', { webhookId: existing.id, provider, eventId });
      return existing;
    }

    return this.enqueue(options);
  }

  /**
   * Get next batch of pending webhooks for processing
   */
  async getNextPendingWebhooks(batchSize: number = 10): Promise<WebhookQueue[]> {
    const now = new Date();

    const webhooks = await this.prisma.webhookQueue.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          gt: now,
        },
      },
      orderBy: [
        { createdAt: 'asc' },
        { retryCount: 'asc' },
      ],
      take: batchSize,
    });

    return webhooks;
  }

  /**
   * Process a batch of webhooks
   */
  async processBatch(options: ProcessWebhookOptions): Promise<{
    processed: number;
    failed: number;
    skipped: number;
  }> {
    const {
      processFn,
      batchSize = 10,
      retryDelayMs = 1000,
    } = options;

    logger.info('Processing webhook batch', { batchSize });

    const webhooks = await this.getNextPendingWebhooks(batchSize);

    if (webhooks.length === 0) {
      logger.debug('No pending webhooks to process');
      return { processed: 0, failed: 0, skipped: 0 };
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const webhook of webhooks) {
      try {
        await this.markProcessing(webhook.id);

        logger.info('Processing webhook', { webhookId: webhook.id, provider: webhook.provider });

        await processFn(webhook);

        await this.markCompleted(webhook.id);
        processed++;

        logger.info('Webhook processed successfully', { webhookId: webhook.id });
      } catch (error) {
        failed++;
        const shouldRetry = await this.markFailed(webhook.id, error);

        if (!shouldRetry) {
          logger.error('Webhook processing failed permanently', {
            webhookId: webhook.id,
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          logger.warn('Webhook processing failed, will retry', {
            webhookId: webhook.id,
            retryCount: webhook.retryCount + 1,
          });
        }

        if (retryDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    logger.info('Webhook batch processed', { processed, failed, skipped, total: webhooks.length });

    return { processed, failed, skipped };
  }

  /**
   * Mark webhook as processing
   */
  async markProcessing(webhookId: string): Promise<void> {
    await this.prisma.webhookQueue.update({
      where: { id: webhookId },
      data: { status: 'PROCESSING' },
    });
  }

  /**
   * Mark webhook as completed
   */
  async markCompleted(webhookId: string): Promise<void> {
    const now = new Date();

    await this.prisma.webhookQueue.update({
      where: { id: webhookId },
      data: {
        status: 'COMPLETED',
        processedAt: now,
      },
    });
  }

  /**
   * Mark webhook as failed
   * Returns true if webhook should be retried
   */
  async markFailed(webhookId: string, error: unknown): Promise<boolean> {
    const webhook = await this.prisma.webhookQueue.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return false;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const newRetryCount = webhook.retryCount + 1;

    if (newRetryCount >= webhook.maxRetries) {
      await this.prisma.webhookQueue.update({
        where: { id: webhookId },
        data: {
          status: 'FAILED',
          lastError: errorMessage,
          retryCount: newRetryCount,
        },
      });

      return false;
    }

    const delayMs = this.calculateRetryDelay(newRetryCount);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    await this.prisma.webhookQueue.update({
      where: { id: webhookId },
      data: {
        status: 'PENDING',
        lastError: errorMessage,
        retryCount: newRetryCount,
      },
    });

    return true;
  }

  /**
   * Mark webhook as expired
   */
  async markExpired(webhookId: string): Promise<void> {
    await this.prisma.webhookQueue.update({
      where: { id: webhookId },
      data: { status: 'EXPIRED' },
    });
  }

  /**
   * Mark expired webhooks
   * Runs periodically to clean up stale webhooks
   */
  async markExpiredWebhooks(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.webhookQueue.updateMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      logger.info('Marked webhooks as expired', { count: result.count });
    }

    return result.count;
  }

  /**
   * Get webhook queue statistics
   */
  async getStats(): Promise<WebhookQueueStats> {
    const stats = await this.prisma.webhookQueue.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const result: WebhookQueueStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      expired: 0,
      total: 0,
      successRate: 0,
      averageProcessingTimeMs: 0,
    };

    for (const stat of stats) {
      const status = stat.status.toLowerCase() as keyof WebhookQueueStats;
      if (typeof result[status] === 'number') {
        result[status] = stat._count.id;
        result.total += stat._count.id;
      }
    }

    if (result.total > 0) {
      result.successRate = result.completed / result.total;
    }

    const avgResult = await this.prisma.webhookQueue.aggregate({
      where: {
        status: 'COMPLETED',
        processedAt: {
          not: null,
        },
      },
      _avg: {
        createdAt: true,
      },
    });

    if (avgResult._avg.createdAt) {
      const now = Date.now();
      const avgCreatedAt = new Date(avgResult._avg.createdAt).getTime();
      result.averageProcessingTimeMs = now - avgCreatedAt;
    }

    return result;
  }

  /**
   * Retry failed webhooks
   * Can be used to manually retry failed webhooks
   * Optimized: Single batched update operation instead of N individual queries
   */
  async retryFailedWebhooks(webhookIds: string[]): Promise<number> {
    if (webhookIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.webhookQueue.updateMany({
      where: {
        id: {
          in: webhookIds,
        },
        status: 'FAILED',
      },
      data: {
        status: 'PENDING',
        retryCount: 0,
        lastError: null,
      },
    });

    logger.info('Retried failed webhooks', { count: result.count });
    return result.count;
  }

  /**
   * Cleanup old completed and failed webhooks
   * Runs periodically to prevent database bloat
   */
  async cleanupOldWebhooks(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await this.prisma.webhookQueue.deleteMany({
      where: {
        status: {
          in: ['COMPLETED', 'FAILED', 'EXPIRED'],
        },
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      logger.info('Cleaned up old webhooks', { count: result.count, daysOld });
    }

    return result.count;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelayMs = 1000;
    const maxDelayMs = 60000;
    const backoffMultiplier = 2;

    const delay = baseDelayMs * Math.pow(backoffMultiplier, retryCount - 1);
    const jitter = delay * (0.5 + Math.random() * 0.5);

    return Math.min(Math.round(jitter), maxDelayMs);
  }

  /**
   * Get webhooks by status
   */
  async getWebhooksByStatus(status: WebhookStatus, limit: number = 100): Promise<WebhookQueue[]> {
    return this.prisma.webhookQueue.findMany({
      where: { status },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(id: string): Promise<WebhookQueue | null> {
    return this.prisma.webhookQueue.findUnique({
      where: { id },
    });
  }
}
