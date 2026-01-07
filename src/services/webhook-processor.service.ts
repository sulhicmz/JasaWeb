/**
 * Webhook Processor Service
 * 
 * Background job processor for webhook queue.
 * Handles reliable webhook processing with automatic retries.
 */

import { getPrisma, createPrismaClient } from '@/lib/prisma';
import { WebhookQueueService } from '@/services/webhook-queue.service';
import { Logger } from '@/lib/logger';
import { processMidtransWebhook } from '@/pages/api/webhooks/midtrans';

const logger = new Logger('WebhookProcessor');

export interface WebhookProcessorConfig {
  batchSize?: number;
  pollingIntervalMs?: number;
  maxProcessingTimeMs?: number;
  retryDelayMs?: number;
}

export class WebhookProcessorService {
  private webhookQueueService: WebhookQueueService;
  private isProcessing = false;
  private config: Required<WebhookProcessorConfig>;

  constructor(prisma: ReturnType<typeof getPrisma>, config: WebhookProcessorConfig = {}) {
    this.webhookQueueService = new WebhookQueueService(prisma as any);
    this.config = {
      batchSize: config.batchSize ?? 10,
      pollingIntervalMs: config.pollingIntervalMs ?? 5000, // 5 seconds
      maxProcessingTimeMs: config.maxProcessingTimeMs ?? 30000, // 30 seconds
      retryDelayMs: config.retryDelayMs ?? 1000,
    };
  }

  /**
   * Start processing webhooks in the background
   */
  async start(): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Webhook processor already running');
      return;
    }

    this.isProcessing = true;
    logger.info('Webhook processor started', { config: this.config });

    // Process webhooks in a loop
    await this.processLoop();
  }

  /**
   * Stop processing webhooks
   */
  async stop(): Promise<void> {
    if (!this.isProcessing) {
      logger.warn('Webhook processor not running');
      return;
    }

    this.isProcessing = false;
    logger.info('Webhook processor stopped');
  }

  /**
   * Main processing loop
   */
  private async processLoop(): Promise<void> {
    while (this.isProcessing) {
      try {
        const stats = await this.webhookQueueService.getStats();
        
        logger.debug('Webhook queue stats', { 
          pending: stats.pending,
          processing: stats.processing,
          failed: stats.failed,
        });

        if (stats.pending === 0) {
          // No webhooks to process, wait for next poll
          await this.sleep(this.config.pollingIntervalMs);
          continue;
        }

        // Process batch of webhooks
        const result = await this.processBatch();

        if (result.processed > 0 || result.failed > 0) {
          logger.info('Webhook batch processed', result);
        }

        // Wait before next batch
        await this.sleep(this.config.pollingIntervalMs);

      } catch (error) {
        logger.error('Error in webhook processing loop', { error });
        // Wait before retrying after error
        await this.sleep(this.config.pollingIntervalMs * 2);
      }
    }
  }

  /**
   * Process a single batch of webhooks
   */
  private async processBatch(): Promise<{ processed: number; failed: number; skipped: number }> {
    const result = await this.webhookQueueService.processBatch({
      processFn: this.processWebhook.bind(this),
      batchSize: this.config.batchSize,
      retryDelayMs: this.config.retryDelayMs,
    });

    return result;
  }

  /**
   * Process a single webhook
   */
  private async processWebhook(webhook: { 
    id: string; 
    provider: string; 
    eventType: string; 
    payload: Record<string, unknown>; 
  }): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('Processing webhook', { 
        webhookId: webhook.id, 
        provider: webhook.provider,
        eventType: webhook.eventType,
      });

      // Route webhook to appropriate processor
      switch (webhook.provider) {
        case 'midtrans':
          await this.processMidtransWebhook(webhook);
          break;
        default:
          logger.warn('Unknown webhook provider', { provider: webhook.provider });
          throw new Error(`Unknown webhook provider: ${webhook.provider}`);
      }

      const durationMs = Date.now() - startTime;
      logger.info('Webhook processed successfully', { 
        webhookId: webhook.id, 
        durationMs,
      });

    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger.error('Webhook processing failed', { 
        webhookId: webhook.id, 
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      });
      throw error;
    }
  }

  /**
   * Process Midtrans webhook
   */
  private async processMidtransWebhook(webhook: {
    id: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const env = {
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL },
    };
    const prisma = createPrismaClient(env as any);

    try {
      await processMidtransWebhook(prisma, webhook);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run once to process all pending webhooks
   * Useful for testing or one-off processing
   */
  async processOnce(): Promise<{ processed: number; failed: number; skipped: number }> {
    logger.info('Processing webhooks once');

    const stats = await this.webhookQueueService.getStats();
    
    if (stats.pending === 0) {
      logger.info('No pending webhooks to process');
      return { processed: 0, failed: 0, skipped: 0 };
    }

    return await this.processBatch();
  }

  /**
   * Cleanup old webhooks
   * Should be called periodically to prevent database bloat
   */
  async cleanup(daysOld: number = 7): Promise<number> {
    logger.info('Cleaning up old webhooks', { daysOld });

    const count = await this.webhookQueueService.cleanupOldWebhooks(daysOld);

    logger.info('Cleanup completed', { count });
    return count;
  }

  /**
   * Mark expired webhooks
   * Should be called periodically to handle stale webhooks
   */
  async markExpired(): Promise<number> {
    logger.info('Marking expired webhooks');

    const count = await this.webhookQueueService.markExpiredWebhooks();

    logger.info('Expired webhooks marked', { count });
    return count;
  }
}

/**
 * Singleton instance for webhook processor
 * Can be used in production for continuous processing
 */
let webhookProcessorInstance: WebhookProcessorService | null = null;

export function getWebhookProcessor(config?: WebhookProcessorConfig): WebhookProcessorService {
  if (!webhookProcessorInstance) {
    const env = {
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL },
    };
    const prisma = createPrismaClient(env as any);
    webhookProcessorInstance = new WebhookProcessorService(prisma, config);
  }
  return webhookProcessorInstance;
}
