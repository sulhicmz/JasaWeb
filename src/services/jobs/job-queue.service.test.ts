import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobQueueService } from './job-queue.service';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('JobQueueService', () => {
  let prisma: any;
  let jobQueueService: JobQueueService;

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      jobQueue: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    jobQueueService = new JobQueueService(prisma);
  });

  describe('createJob', () => {
    it('should create a job with valid payload and options', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'HIGH',
        maxRetries: 5,
        payload: { type: 'NOTIFICATION', userId: 'user123', message: 'Test' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const payload = { type: 'NOTIFICATION', userId: 'user123', message: 'Test' };
      const options = { type: 'NOTIFICATION' as any, priority: 'HIGH' as any, maxRetries: 5 };

      const job = await jobQueueService.createJob(payload, options);

      expect(job).toBeDefined();
      expect(job.id).toBe('job-1');
      expect(prisma.jobQueue.create).toHaveBeenCalled();
    });

    it('should create a job with default priority and retries', async () => {
      const mockJob = {
        id: 'job-2',
        type: 'REPORT_GENERATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: { type: 'REPORT_GENERATION', reportType: 'sales' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const payload = { type: 'REPORT_GENERATION', reportType: 'sales' };
      const options = { type: 'REPORT_GENERATION' as any };

      const job = await jobQueueService.createJob(payload, options);

      expect(job).toBeDefined();
      expect(prisma.jobQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'MEDIUM',
            maxRetries: 3,
          }),
        })
      );
    });

    it('should create a job with scheduled time', async () => {
      const scheduledAt = new Date(Date.now() + 60000);
      const mockJob = {
        id: 'job-3',
        type: 'EMAIL_SEND',
        status: 'PENDING',
        scheduledAt,
        payload: { type: 'EMAIL_SEND', to: 'test@example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const payload = { type: 'EMAIL_SEND', to: 'test@example.com' };
      const options = {
        type: 'EMAIL_SEND' as any,
        scheduledAt,
      };

      const job = await jobQueueService.createJob(payload, options);

      expect(job).toBeDefined();
      expect(prisma.jobQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledAt,
          }),
        })
      );
    });
  });

  describe('getJobById', () => {
    it('should retrieve job by id', async () => {
      const mockJob = {
        id: 'job-123',
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.findUnique.mockResolvedValue(mockJob);

      const job = await jobQueueService.getJobById('job-123');

      expect(job).toBeDefined();
      expect(job?.id).toBe('job-123');
      expect(prisma.jobQueue.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' },
      });
    });

    it('should return undefined for non-existent job', async () => {
      prisma.jobQueue.findUnique.mockResolvedValue(null);

      const job = await jobQueueService.getJobById('non-existent-id');

      expect(job).toBeNull();
    });
  });

  describe('getPendingJobs', () => {
    it('should retrieve pending jobs ordered by priority', async () => {
      const mockJobs = [
        { id: 'job-1', priority: 'HIGH', status: 'PENDING' },
        { id: 'job-2', priority: 'MEDIUM', status: 'PENDING' },
      ];

      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);

      const pending = await jobQueueService.getPendingJobs(10);

      expect(Array.isArray(pending)).toBe(true);
      expect(pending.length).toBe(2);
      expect(prisma.jobQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
          take: 10,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' },
          ],
        })
      );
    });
  });

  describe('getFailedJobsForRetry', () => {
    it('should retrieve failed jobs eligible for retry', async () => {
      const mockJobs = [
        { id: 'job-1', status: 'FAILED', retryCount: 1, maxRetries: 3 },
        { id: 'job-2', status: 'FAILED', retryCount: 2, maxRetries: 3 },
      ];

      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);

      const failed = await jobQueueService.getFailedJobsForRetry(10);

      expect(Array.isArray(failed)).toBe(true);
      expect(prisma.jobQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'FAILED',
            retryCount: { lt: 3 },
          }),
          take: 10,
        })
      );
    });
  });

  describe('markJobAsProcessing', () => {
    it('should update job status to PROCESSING', async () => {
      const now = new Date();
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'PROCESSING',
        startedAt: now,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.update.mockResolvedValue(mockJob);

      const updated = await jobQueueService.markJobAsProcessing('job-1');

      expect(updated.status).toBe('PROCESSING');
      expect(updated.startedAt).toBeDefined();
      expect(prisma.jobQueue.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({
          status: 'PROCESSING',
          startedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('markJobAsCompleted', () => {
    it('should mark job as completed with result', async () => {
      const now = new Date();
      const result = { success: true, data: 'completed' };

      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'COMPLETED',
        completedAt: now,
        result,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.update.mockResolvedValue(mockJob);

      const updated = await jobQueueService.markJobAsCompleted('job-1', result);

      expect(updated.status).toBe('COMPLETED');
      expect(updated.completedAt).toBeDefined();
      expect(prisma.jobQueue.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          result,
        }),
      });
    });
  });

  describe('markJobAsFailed', () => {
    it('should mark job as failed with error', async () => {
      const currentJob = {
        id: 'job-1',
        retryCount: 0,
        maxRetries: 3,
      };

      const updatedJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'FAILED',
        error: 'Job execution failed',
        retryCount: 1,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      prisma.jobQueue.findUnique.mockResolvedValue(currentJob);
      prisma.jobQueue.update.mockResolvedValue(updatedJob);

      const updated = await jobQueueService.markJobAsFailed('job-1', 'Job execution failed', false);

      expect(['FAILED', 'RETRYING']).toContain(updated.status);
      expect(updated.error).toBe('Job execution failed');
      expect(prisma.jobQueue.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        select: { retryCount: true, maxRetries: true },
      });
    });

    it('should mark as RETRYING if retries remain', async () => {
      const currentJob = {
        id: 'job-1',
        retryCount: 1,
        maxRetries: 5,
      };

      const updatedJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'RETRYING',
        retryCount: 2,
        priority: 'MEDIUM',
        maxRetries: 5,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.findUnique.mockResolvedValue(currentJob);
      prisma.jobQueue.update.mockResolvedValue(updatedJob);

      const updated = await jobQueueService.markJobAsFailed('job-1', 'Temporary error', true);

      expect(updated.status).toBe('RETRYING');
      expect(updated.retryCount).toBeGreaterThan(0);
    });

    it('should mark as FAILED if max retries exceeded', async () => {
      const currentJob = {
        id: 'job-1',
        retryCount: 3,
        maxRetries: 3,
      };

      const updatedJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'FAILED',
        retryCount: 4,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      prisma.jobQueue.findUnique.mockResolvedValue(currentJob);
      prisma.jobQueue.update.mockResolvedValue(updatedJob);

      const updated = await jobQueueService.markJobAsFailed('job-1', 'Permanent error', true);

      expect(updated.status).toBe('FAILED');
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending job', async () => {
      const now = new Date();
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'CANCELLED',
        completedAt: now,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.update.mockResolvedValue(mockJob);

      const updated = await jobQueueService.cancelJob('job-1');

      expect(updated.status).toBe('CANCELLED');
      expect(updated.completedAt).toBeDefined();
      expect(prisma.jobQueue.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          completedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      prisma.jobQueue.delete.mockResolvedValue({ id: 'job-1' });
      prisma.jobQueue.findUnique.mockResolvedValue(null);

      await jobQueueService.deleteJob('job-1');
      const deleted = await jobQueueService.getJobById('job-1');

      expect(deleted).toBeNull();
      expect(prisma.jobQueue.delete).toHaveBeenCalledWith({
        where: { id: 'job-1' },
      });
    });
  });

  describe('getJobs', () => {
    it('should retrieve jobs with pagination', async () => {
      prisma.jobQueue.count.mockResolvedValue(100);
      prisma.jobQueue.findMany.mockResolvedValue([
        { id: 'job-1' },
        { id: 'job-2' },
      ]);

      const result = await jobQueueService.getJobs({}, 1, 20);

      expect(result).toHaveProperty('jobs');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
    });

    it('should filter jobs by status', async () => {
      const mockJobs = [
        { id: 'job-1', status: 'PENDING' },
        { id: 'job-2', status: 'PENDING' },
      ];

      prisma.jobQueue.count.mockResolvedValue(2);
      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);

      const result = await jobQueueService.getJobs({ status: 'PENDING' as any }, 1, 20);

      expect(result.jobs.every((job: any) => job.status === 'PENDING')).toBe(true);
      expect(prisma.jobQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should filter jobs by type', async () => {
      const mockJobs = [
        { id: 'job-1', type: 'NOTIFICATION' },
        { id: 'job-2', type: 'NOTIFICATION' },
      ];

      prisma.jobQueue.count.mockResolvedValue(2);
      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);

      const result = await jobQueueService.getJobs({ type: 'NOTIFICATION' as any }, 1, 20);

      expect(result.jobs.every((job: any) => job.type === 'NOTIFICATION')).toBe(true);
      expect(prisma.jobQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'NOTIFICATION',
          }),
        })
      );
    });

    it('should filter jobs by priority', async () => {
      const mockJobs = [
        { id: 'job-1', priority: 'HIGH' },
        { id: 'job-2', priority: 'HIGH' },
      ];

      prisma.jobQueue.count.mockResolvedValue(2);
      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);

      const result = await jobQueueService.getJobs({ priority: 'HIGH' as any }, 1, 20);

      expect(result.jobs.every((job: any) => job.priority === 'HIGH')).toBe(true);
      expect(prisma.jobQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'HIGH',
          }),
        })
      );
    });
  });

  describe('getJobStats', () => {
    it('should return accurate job statistics', async () => {
      prisma.jobQueue.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      const stats = await jobQueueService.getJobStats();

      expect(stats).toHaveProperty('total', 100);
      expect(stats).toHaveProperty('pending', 25);
      expect(stats).toHaveProperty('processing', 10);
      expect(stats).toHaveProperty('completed', 50);
      expect(stats).toHaveProperty('failed', 10);
      expect(stats).toHaveProperty('cancelled', 3);
      expect(stats).toHaveProperty('retrying', 2);
      expect(typeof stats.total).toBe('number');
      expect(prisma.jobQueue.count).toHaveBeenCalledTimes(7);
    });
  });

  describe('cleanupOldJobs', () => {
    it('should delete completed jobs older than specified days', async () => {
      prisma.jobQueue.deleteMany.mockResolvedValue({ count: 15 });

      const deleted = await jobQueueService.cleanupOldJobs(7);

      expect(deleted).toBe(15);
      expect(prisma.jobQueue.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
          }),
        })
      );
    });

    it('should handle 0 days parameter', async () => {
      prisma.jobQueue.deleteMany.mockResolvedValue({ count: 5 });

      const deleted = await jobQueueService.cleanupOldJobs(0);

      expect(typeof deleted).toBe('number');
      expect(deleted).toBe(5);
    });
  });

  describe('retryFailedJobs', () => {
    it('should retry failed jobs', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'PENDING',
        retryCount: 1,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.findMany.mockResolvedValue([mockJob]);
      prisma.jobQueue.update
        .mockResolvedValueOnce({ id: 'job-1', status: 'PENDING' })
        .mockResolvedValueOnce(mockJob);

      const retried = await jobQueueService.retryFailedJobs(['job-1']);

      expect(retried.length).toBeGreaterThan(0);
      expect(prisma.jobQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });
  });
});
