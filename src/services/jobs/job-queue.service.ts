import type { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { JobType, JobStatus, JobPriority } from '@/lib/prisma';

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
  constructor(private prisma: PrismaClient) {}
  async createJob(
    payload: Record<string, unknown>,
    options: CreateJobOptions
  ) {
    return this.prisma.jobQueue.create({
      data: {
        type: options.type,
        priority: options.priority || 'MEDIUM',
        payload: payload as Prisma.InputJsonValue,
        scheduledAt: options.scheduledAt || new Date(),
        maxRetries: options.maxRetries || 3,
        userId: options.userId,
        metadata: options.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async getJobById(id: string) {
    return this.prisma.jobQueue.findUnique({
      where: { id },
    });
  }

  async getPendingJobs(limit: number = 10) {
    return this.prisma.jobQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });
  }

  async getFailedJobsForRetry(limit: number = 10) {
    return this.prisma.jobQueue.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: 3 },
      },
      orderBy: [{ createdAt: 'asc' }],
      take: limit,
    });
  }

  async updateJob(id: string, options: UpdateJobOptions) {
    return this.prisma.jobQueue.update({
      where: { id },
      data: {
        status: options.status,
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

  async markJobAsProcessing(id: string) {
    return this.prisma.jobQueue.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });
  }

  async markJobAsCompleted(id: string, result?: Record<string, unknown>) {
    return this.prisma.jobQueue.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: result as Prisma.InputJsonValue,
      },
    });
  }

  async markJobAsFailed(
    id: string,
    error: string,
    incrementRetry: boolean = true
  ) {
    const currentJob = await this.prisma.jobQueue.findUnique({
      where: { id },
      select: { retryCount: true, maxRetries: true },
    });

    if (!currentJob) {
      throw new Error('Job not found');
    }

    const newRetryCount = incrementRetry ? currentJob.retryCount + 1 : currentJob.retryCount;
    const shouldRetry = newRetryCount < currentJob.maxRetries;

    return this.prisma.jobQueue.update({
      where: { id },
      data: {
        status: shouldRetry ? 'RETRYING' : 'FAILED',
        retryCount: newRetryCount,
        error,
        lastError: error,
        completedAt: shouldRetry ? undefined : new Date(),
      },
    });
  }

  async cancelJob(id: string) {
    return this.prisma.jobQueue.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  }

  async deleteJob(id: string) {
    return this.prisma.jobQueue.delete({
      where: { id },
    });
  }

  async getJobs(filter: JobQueueFilter = {}, page: number = 1, limit: number = 20) {
    const where: Record<string, unknown> = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.priority) {
      where.priority = filter.priority;
    }
    if (filter.userId) {
      where.userId = filter.userId;
    }

    const [total, jobs] = await Promise.all([
      this.prisma.jobQueue.count({ where }),
      this.prisma.jobQueue.findMany({
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

  async getJobStats(): Promise<JobStats> {
    const [total, pending, processing, completed, failed, cancelled, retrying] =
      await Promise.all([
        this.prisma.jobQueue.count(),
        this.prisma.jobQueue.count({ where: { status: 'PENDING' } }),
        this.prisma.jobQueue.count({ where: { status: 'PROCESSING' } }),
        this.prisma.jobQueue.count({ where: { status: 'COMPLETED' } }),
        this.prisma.jobQueue.count({ where: { status: 'FAILED' } }),
        this.prisma.jobQueue.count({ where: { status: 'CANCELLED' } }),
        this.prisma.jobQueue.count({ where: { status: 'RETRYING' } }),
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

  async cleanupOldJobs(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.jobQueue.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
        completedAt: { lte: cutoffDate },
      },
    });

    return result.count;
  }

  async retryFailedJobs(jobIds: string[]) {
    const jobs = await this.prisma.jobQueue.findMany({
      where: { id: { in: jobIds }, status: 'FAILED' },
    });

    const updated = await Promise.all(
      jobs.map((job) =>
        this.prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
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
