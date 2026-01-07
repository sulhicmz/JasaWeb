import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobSchedulerService } from './job-scheduler.service';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('JobSchedulerService', () => {
  let prisma: any;
  let jobSchedulerService: JobSchedulerService;

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

    jobSchedulerService = new JobSchedulerService(prisma);
  });

  describe('processNextJob', () => {
    it('should process next pending job', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: { type: 'NOTIFICATION', userId: 'user123', message: 'Test' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.findMany.mockResolvedValue([mockJob]);
      prisma.jobQueue.update.mockResolvedValue({ ...mockJob, status: 'PROCESSING', startedAt: new Date() });
      prisma.jobQueue.update.mockResolvedValueOnce({ ...mockJob, status: 'COMPLETED', completedAt: new Date() });

      const processed = await jobSchedulerService.processNextJob();

      expect(typeof processed).toBe('boolean');
      expect(prisma.jobQueue.findMany).toHaveBeenCalled();
    });

    it('should return false when no pending jobs', async () => {
      prisma.jobQueue.findMany.mockResolvedValue([]);

      const processed = await jobSchedulerService.processNextJob();

      expect(processed).toBe(false);
      expect(prisma.jobQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            scheduledAt: { lte: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('processBatch', () => {
    it('should process multiple jobs in batch', async () => {
      const mockJobs = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i}`,
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);
      prisma.jobQueue.update.mockImplementation(({ where, data }: any) => 
        Promise.resolve({ ...mockJobs.find((j: any) => j.id === where.id), ...data })
      );

      const results = await jobSchedulerService.processBatch(5);

      expect(results).toHaveProperty('processed', 5);
      expect(results).toHaveProperty('successful');
      expect(results).toHaveProperty('failed');
      expect(typeof results.processed).toBe('number');
    });

    it('should respect max jobs limit', async () => {
      const mockJobs = Array.from({ length: 15 }, (_, i) => ({
        id: `job-${i}`,
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      prisma.jobQueue.findMany.mockResolvedValue(mockJobs);
      prisma.jobQueue.update.mockImplementation(({ where, data }: any) => 
        Promise.resolve({ ...mockJobs.find((j: any) => j.id === where.id), ...data })
      );

      const results = await jobSchedulerService.processBatch(10);

      expect(results.processed).toBeLessThanOrEqual(10);
    });
  });

  describe('scheduleJob', () => {
    it('should schedule a job with type and payload', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: { userId: 'user123', message: 'Test notification' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleJob('NOTIFICATION', {
        userId: 'user123',
        message: 'Test notification',
      });

      expect(job).toBeDefined();
      expect(job.id).toBe('job-1');
      expect(prisma.jobQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'NOTIFICATION',
            priority: 'MEDIUM',
          }),
        })
      );
    });

    it('should schedule job with priority', async () => {
      const mockJob = {
        id: 'job-2',
        type: 'REPORT_GENERATION',
        status: 'PENDING',
        priority: 'HIGH',
        maxRetries: 3,
        payload: { reportType: 'sales' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleJob(
        'REPORT_GENERATION',
        { reportType: 'sales' },
        { priority: 'HIGH' }
      );

      expect(job).toBeDefined();
      expect(prisma.jobQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'REPORT_GENERATION',
            priority: 'HIGH',
          }),
        })
      );
    });

    it('should schedule job with future time', async () => {
      const scheduledAt = new Date(Date.now() + 60000);
      const mockJob = {
        id: 'job-3',
        type: 'EMAIL_SEND',
        status: 'PENDING',
        priority: 'MEDIUM',
        scheduledAt,
        maxRetries: 3,
        payload: { to: 'test@example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleJob(
        'EMAIL_SEND',
        { to: 'test@example.com' },
        { scheduledAt }
      );

      expect(job).toBeDefined();
      expect(prisma.jobQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'EMAIL_SEND',
            scheduledAt,
          }),
        })
      );
    });
  });

  describe('scheduleNotificationJob', () => {
    it('should schedule notification with medium priority by default', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {
          type: 'NOTIFICATION',
          userId: 'user123',
          notification: { type: 'INFO', title: 'Test', message: 'Test message' },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleNotificationJob({
        userId: 'user123',
        type: 'INFO',
        title: 'Test',
        message: 'Test message',
      });

      expect(job).toBeDefined();
      expect(job.priority).toBe('MEDIUM');
    });

    it('should schedule notification with custom priority', async () => {
      const mockJob = {
        id: 'job-2',
        type: 'NOTIFICATION',
        status: 'PENDING',
        priority: 'HIGH',
        maxRetries: 3,
        payload: {
          type: 'NOTIFICATION',
          userId: 'user123',
          notification: { type: 'INFO', title: 'Test', message: 'Test message' },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleNotificationJob(
        {
          userId: 'user123',
          type: 'INFO',
          title: 'Test',
          message: 'Test message',
        },
        { priority: 'HIGH' }
      );

      expect(job).toBeDefined();
      expect(job.priority).toBe('HIGH');
    });
  });

  describe('scheduleReportJob', () => {
    it('should schedule report with low priority by default', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'REPORT_GENERATION',
        status: 'PENDING',
        priority: 'LOW',
        maxRetries: 3,
        payload: {
          type: 'REPORT_GENERATION',
          reportType: 'sales',
          parameters: { format: 'pdf' },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleReportJob({
        reportType: 'sales',
        parameters: { format: 'pdf' },
      });

      expect(job).toBeDefined();
      expect(job.priority).toBe('LOW');
    });

    it('should schedule report with custom priority', async () => {
      const mockJob = {
        id: 'job-2',
        type: 'REPORT_GENERATION',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {
          type: 'REPORT_GENERATION',
          reportType: 'revenue',
          parameters: { format: 'csv' },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleReportJob(
        {
          reportType: 'revenue',
          parameters: { format: 'csv' },
        },
        { priority: 'MEDIUM' }
      );

      expect(job).toBeDefined();
      expect(job.priority).toBe('MEDIUM');
    });
  });

  describe('scheduleEmailJob', () => {
    it('should schedule email with medium priority by default', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'EMAIL_SEND',
        status: 'PENDING',
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {
          type: 'EMAIL_SEND',
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test email',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.jobQueue.create.mockResolvedValue(mockJob);

      const job = await jobSchedulerService.scheduleEmailJob({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test email',
      });

      expect(job).toBeDefined();
      expect(job.priority).toBe('MEDIUM');
    });
  });

  describe('getQueueHealth', () => {
    it('should return queue health status', async () => {
      prisma.jobQueue.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      const health = await jobSchedulerService.getQueueHealth();

      expect(health).toHaveProperty('stats');
      expect(health).toHaveProperty('healthScore');
      expect(health).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.stats).toHaveProperty('total', 100);
    });

    it('should calculate health score correctly', async () => {
      prisma.jobQueue.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const health = await jobSchedulerService.getQueueHealth();

      expect(typeof health.healthScore).toBe('number');
      expect(health.healthScore).toBeGreaterThanOrEqual(0);
      expect(health.healthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('cleanupOldJobs', () => {
    it('should cleanup old jobs', async () => {
      prisma.jobQueue.deleteMany.mockResolvedValue({ count: 15 });

      const deleted = await jobSchedulerService.cleanupOldJobs(7);

      expect(typeof deleted).toBe('number');
      expect(deleted).toBe(15);
      expect(prisma.jobQueue.deleteMany).toHaveBeenCalled();
    });

    it('should cleanup with custom days parameter', async () => {
      prisma.jobQueue.deleteMany.mockResolvedValue({ count: 42 });

      const deleted = await jobSchedulerService.cleanupOldJobs(30);

      expect(typeof deleted).toBe('number');
      expect(deleted).toBe(42);
    });
  });

  describe('registerHandler', () => {
    it('should register custom job handler', () => {
      const mockHandler = {
        handle: vi.fn().mockResolvedValue({ success: true }),
      };

      jobSchedulerService.registerHandler('CUSTOM', mockHandler as any);

      expect(jobSchedulerService['handlers']).toBeDefined();
      expect(jobSchedulerService['handlers']['CUSTOM']).toBe(mockHandler);
    });
  });

  describe('retryStuckJobs', () => {
    it('should retry stuck jobs', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'NOTIFICATION',
        status: 'FAILED',
        startedAt: new Date(),
        retryCount: 0,
        priority: 'MEDIUM',
        maxRetries: 3,
        payload: {},
        lastError: 'Job timeout',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCurrentJob = {
        id: 'job-1',
        retryCount: 0,
        maxRetries: 3,
      };

      const mockRetriedJob = {
        ...mockJob,
        status: 'RETRYING',
        retryCount: 1,
      };

      prisma.jobQueue.findMany.mockResolvedValue([mockJob]);
      prisma.jobQueue.findUnique.mockResolvedValue(mockCurrentJob);
      prisma.jobQueue.update
        .mockResolvedValueOnce(mockRetriedJob)
        .mockResolvedValueOnce(mockRetriedJob);

      const retried = await jobSchedulerService.retryStuckJobs();

      expect(typeof retried).toBe('number');
      expect(retried).toBeGreaterThan(0);
      expect(retried).toBe(1);
      expect(prisma.jobQueue.findMany).toHaveBeenCalled();
    });
  });
});
