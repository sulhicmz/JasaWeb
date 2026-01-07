import { logger } from '@/lib/logger';
import { NotificationJobHandler } from './job-notification.service';
import { ReportJobHandler } from './job-report.service';

export interface JobHandler {
  handle(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export class JobSchedulerService {
  private static handlers: Map<string, JobHandler> = new Map([
    ['NOTIFICATION', new NotificationJobHandler()],
    ['REPORT_GENERATION', new ReportJobHandler()],
    ['EMAIL_SEND', new NotificationJobHandler()],
  ]);

  static registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  static async processNextJob(): Promise<boolean> {
    const { JobQueueService } = await import('./job-queue.service');
    const pendingJobs = await JobQueueService.getPendingJobs(1);

    if (pendingJobs.length === 0) {
      return false;
    }

    const job = pendingJobs[0] as unknown as { id: string; type: string; payload: Record<string, unknown> };

    try {
      await JobQueueService.markJobAsProcessing(job.id);

      const handler = this.handlers.get(job.type);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      const result = await handler.handle(job.payload);

      await JobQueueService.markJobAsCompleted(job.id, result);

      logger.info(`Job completed successfully`, {
        jobId: job.id,
        type: job.type,
      } as Record<string, unknown>);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Job failed`, {
        jobId: job.id,
        type: job.type,
        error: errorMessage,
      } as Record<string, unknown>);

      await JobQueueService.markJobAsFailed(job.id, errorMessage, true);
      return false;
    }
  }

  static async processBatch(maxJobs: number = 10): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
    };

    for (let i = 0; i < maxJobs; i++) {
      const processed = await this.processNextJob();

      if (!processed) {
        break;
      }

      results.processed++;
      results.successful++;
    }

    return results;
  }

  static async retryStuckJobs(): Promise<number> {
    const { JobQueueService } = await import('./job-queue.service');
    const stuckJobs = await JobQueueService.getFailedJobsForRetry(20);

    for (const job of stuckJobs as unknown as Array<{ id: string; lastError?: string }>) {
      await JobQueueService.markJobAsFailed(job.id, job.lastError || 'Retry', true);
    }

    return stuckJobs.length;
  }

  static async scheduleJob(
    type: string,
    payload: Record<string, unknown>,
    options?: {
      priority?: string;
      scheduledAt?: Date;
      maxRetries?: number;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const { JobQueueService } = await import('./job-queue.service');
    return JobQueueService.createJob(payload, {
      type,
      priority: options?.priority,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries,
      userId: options?.userId,
      metadata: options?.metadata,
    });
  }

  static async scheduleNotificationJob(
    payload: Record<string, unknown>,
    options?: {
      priority?: string;
      userId?: string;
    }
  ) {
      return this.scheduleJob('NOTIFICATION', payload, {
        priority: options?.priority || 'MEDIUM',
        userId: options?.userId,
      });
  }

  static async scheduleReportJob(
    payload: Record<string, unknown>,
    options?: {
      priority?: string;
      scheduledAt?: Date;
      userId?: string;
    }
  ) {
    return this.scheduleJob('REPORT_GENERATION', payload, {
      priority: options?.priority || 'LOW',
      scheduledAt: options?.scheduledAt,
      userId: options?.userId,
    });
  }

  static async scheduleEmailJob(
    payload: Record<string, unknown>,
    options?: {
      priority?: string;
      userId?: string;
    }
  ) {
    return this.scheduleJob('EMAIL_SEND', payload, {
      priority: options?.priority || 'MEDIUM',
      userId: options?.userId,
    });
  }

  static async getQueueHealth() {
    const { JobQueueService } = await import('./job-queue.service');
    const stats = await JobQueueService.getJobStats();

    const healthScore = this.calculateHealthScore(stats);

    return {
      stats,
      healthScore,
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
    };
  }

  private static calculateHealthScore(stats: any): number {
    const total = stats.total || 1;
    const failedRatio = (stats.failed + stats.retrying) / total;
    const processingRatio = stats.processing / total;
    const pendingRatio = stats.pending / total;

    let score = 100;

    score -= failedRatio * 50;
    score -= processingRatio * 30;
    score -= pendingRatio * 20;

    return Math.max(0, Math.min(100, score));
  }

  static async cleanupOldJobs(days: number = 7) {
    const { JobQueueService } = await import('./job-queue.service');
    const deleted = await JobQueueService.cleanupOldJobs(days);
    logger.info(`Cleaned up old jobs`, { deleted, days } as Record<string, unknown>);
    return deleted;
  }
}
