import { logger } from '@/lib/logger';
import type { PrismaClient } from '@prisma/client';
import type { JobType, JobPriority } from '@/lib/prisma';
import { NotificationJobHandler } from './job-notification.service';
import { ReportJobHandler } from './job-report.service';
import { JobQueueService, type JobStats } from './job-queue.service';

export interface JobHandler {
  handle(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export class JobSchedulerService {
  private handlers: Record<string, JobHandler> = {
    'NOTIFICATION': new NotificationJobHandler(),
    'REPORT_GENERATION': new ReportJobHandler(),
    'EMAIL_SEND': new NotificationJobHandler(),
  };

  constructor(private prisma: PrismaClient) {}

  private getJobQueueService(): JobQueueService {
    return new JobQueueService(this.prisma);
  }

  registerHandler(type: string, handler: JobHandler) {
    this.handlers[type] = handler;
  }

  async processNextJob(): Promise<boolean> {
    const jobQueueService = this.getJobQueueService();
    const pendingJobs = await jobQueueService.getPendingJobs(1);

    if (pendingJobs.length === 0) {
      return false;
    }

    const job = pendingJobs[0] as unknown as { id: string; type: string; payload: Record<string, unknown> };

    try {
      await jobQueueService.markJobAsProcessing(job.id);

      const handler = this.handlers[job.type];

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      const result = await handler.handle(job.payload);

      await jobQueueService.markJobAsCompleted(job.id, result);

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

      await jobQueueService.markJobAsFailed(job.id, errorMessage, true);
      return false;
    }
  }

  async processBatch(maxJobs: number = 10): Promise<{
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

  async retryStuckJobs(): Promise<number> {
    const jobQueueService = this.getJobQueueService();
    const stuckJobs = await jobQueueService.getFailedJobsForRetry(20);

    for (const job of stuckJobs as unknown as Array<{ id: string; lastError?: string }>) {
      await jobQueueService.markJobAsFailed(job.id, job.lastError || 'Retry', true);
    }

    return stuckJobs.length;
  }

  async scheduleJob(
    type: JobType,
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
      scheduledAt?: Date;
      maxRetries?: number;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const jobQueueService = this.getJobQueueService();
    return jobQueueService.createJob(payload, {
      type,
      priority: options?.priority,
      scheduledAt: options?.scheduledAt,
      maxRetries: options?.maxRetries,
      userId: options?.userId,
      metadata: options?.metadata,
    });
  }

  async scheduleNotificationJob(
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
      userId?: string;
    }
  ) {
      return this.scheduleJob('NOTIFICATION', payload, {
        priority: options?.priority || 'MEDIUM',
        userId: options?.userId,
      });
  }

  async scheduleReportJob(
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
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

  async scheduleEmailJob(
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
      userId?: string;
    }
  ) {
    return this.scheduleJob('EMAIL_SEND', payload, {
      priority: options?.priority || 'MEDIUM',
      userId: options?.userId,
    });
  }

  async getQueueHealth() {
    const jobQueueService = this.getJobQueueService();
    const stats = await jobQueueService.getJobStats();

    const healthScore = this.calculateHealthScore(stats);

    return {
      stats,
      healthScore,
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
    };
  }

  private calculateHealthScore(stats: JobStats): number {
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

  async cleanupOldJobs(days: number = 7) {
    const jobQueueService = this.getJobQueueService();
    const deleted = await jobQueueService.cleanupOldJobs(days);
    logger.info(`Cleaned up old jobs`, { deleted, days } as Record<string, unknown>);
    return deleted;
  }
}
