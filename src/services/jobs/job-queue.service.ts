import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type JobType = 'NOTIFICATION' | 'REPORT_GENERATION' | 'EMAIL_SEND' | 'WEBHOOK' | 'CLEANUP' | 'BACKUP' | 'DATA_EXPORT' | 'DATA_IMPORT';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RETRYING';
export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface JobQueueFilter {
  status?: JobStatus;
  type?: JobType;
  priority?: JobPriority;
  userId?: string;
}

export interface CreateJobOptions {
  type: JobType;
  priority?: JobPriority;
  scheduledAt?: Date;
  maxRetries?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateJobOptions {
  status?: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount?: number;
  lastError?: string;
  metadata?: Record<string, unknown>;
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  retrying: number;
}

export class JobQueueService {
  static async createJob(
    payload: Record<string, unknown>,
    options: CreateJobOptions
  ) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.create({
      data: {
        type: options.type as unknown as Prisma.JobType,
        priority: (options.priority || 'MEDIUM') as unknown as Prisma.JobPriority,
        payload: payload as Prisma.InputJsonValue,
        scheduledAt: options.scheduledAt || new Date(),
        maxRetries: options.maxRetries || 3,
        userId: options.userId,
        metadata: options.metadata as Prisma.InputJsonValue,
      },
    });
  }

  static async getJobById(id: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.findUnique({
      where: { id },
    });
  }

  static async getPendingJobs(limit: number = 10) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.findMany({
      where: {
        status: 'PENDING' as Prisma.JobStatus,
        scheduledAt: { lte: new Date() },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });
  }

  static async getFailedJobsForRetry(limit: number = 10) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.findMany({
      where: {
        status: 'FAILED' as Prisma.JobStatus,
        retryCount: { lt: 3 },
      },
      orderBy: [{ createdAt: 'asc' }],
      take: limit,
    });
  }

  static async updateJob(id: string, options: UpdateJobOptions) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.update({
      where: { id },
      data: {
        status: options.status as unknown as Prisma.JobStatus,
        result: options.result as Prisma.InputJsonValue,
        error: options.error,
        startedAt: options.startedAt,
        completedAt: options.completedAt,
        retryCount: options.retryCount,
        lastError: options.lastError,
        metadata: options.metadata as Prisma.InputJsonValue,
      },
    });
  }

  static async markJobAsProcessing(id: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.update({
      where: { id },
      data: {
        status: 'PROCESSING' as Prisma.JobStatus,
        startedAt: new Date(),
      },
    });
  }

  static async markJobAsCompleted(id: string, result?: Record<string, unknown>) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.update({
      where: { id },
      data: {
        status: 'COMPLETED' as Prisma.JobStatus,
        completedAt: new Date(),
        result: result as Prisma.InputJsonValue,
      },
    });
  }

  static async markJobAsFailed(
    id: string,
    error: string,
    incrementRetry: boolean = true
  ) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const currentJob = await prisma.jobQueue.findUnique({
      where: { id },
      select: { retryCount: true, maxRetries: true },
    });

    if (!currentJob) {
      throw new Error('Job not found');
    }

    const newRetryCount = incrementRetry ? currentJob.retryCount + 1 : currentJob.retryCount;
    const shouldRetry = newRetryCount < currentJob.maxRetries;

    return prisma.jobQueue.update({
      where: { id },
      data: {
        status: (shouldRetry ? 'RETRYING' : 'FAILED') as Prisma.JobStatus,
        retryCount: newRetryCount,
        error,
        lastError: error,
        completedAt: shouldRetry ? undefined : new Date(),
      },
    });
  }

  static async cancelJob(id: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.update({
      where: { id },
      data: {
        status: 'CANCELLED' as Prisma.JobStatus,
        completedAt: new Date(),
      },
    });
  }

  static async deleteJob(id: string) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    return prisma.jobQueue.delete({
      where: { id },
    });
  }

  static async getJobs(filter: JobQueueFilter = {}, page: number = 1, limit: number = 20) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const where: Prisma.JobQueueWhereInput = {};

    if (filter.status) {
      where.status = filter.status as unknown as Prisma.JobStatus;
    }
    if (filter.type) {
      where.type = filter.type as unknown as Prisma.JobType;
    }
    if (filter.priority) {
      where.priority = filter.priority as unknown as Prisma.JobPriority;
    }
    if (filter.userId) {
      where.userId = filter.userId;
    }

    const [total, jobs] = await Promise.all([
      prisma.jobQueue.count({ where }),
      prisma.jobQueue.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getJobStats(): Promise<JobStats> {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const [total, pending, processing, completed, failed, cancelled, retrying] =
      await Promise.all([
        prisma.jobQueue.count(),
        prisma.jobQueue.count({ where: { status: 'PENDING' as Prisma.JobStatus } }),
        prisma.jobQueue.count({ where: { status: 'PROCESSING' as Prisma.JobStatus } }),
        prisma.jobQueue.count({ where: { status: 'COMPLETED' as Prisma.JobStatus } }),
        prisma.jobQueue.count({ where: { status: 'FAILED' as Prisma.JobStatus } }),
        prisma.jobQueue.count({ where: { status: 'CANCELLED' as Prisma.JobStatus } }),
        prisma.jobQueue.count({ where: { status: 'RETRYING' as Prisma.JobStatus } }),
      ]);

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      cancelled,
      retrying,
    };
  }

  static async cleanupOldJobs(days: number = 7) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.jobQueue.deleteMany({
      where: {
        status: { in: ['COMPLETED' as Prisma.JobStatus, 'FAILED' as Prisma.JobStatus, 'CANCELLED' as Prisma.JobStatus] },
        completedAt: { lte: cutoffDate },
      },
    });

    return result.count;
  }

  static async retryFailedJobs(jobIds: string[]) {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const jobs = await prisma.jobQueue.findMany({
      where: { id: { in: jobIds }, status: 'FAILED' as Prisma.JobStatus },
    });

    const updated = await Promise.all(
      jobs.map((job) =>
        prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'PENDING' as Prisma.JobStatus,
            scheduledAt: new Date(),
            error: null,
            startedAt: null,
            completedAt: null,
          },
        })
      )
    );

    return updated;
  }
}
