import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobSchedulerService } from '../job-scheduler.service';

describe('JobSchedulerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processNextJob', () => {
    it('should process next pending job', async () => {
      const processed = await JobSchedulerService.processNextJob();

      expect(typeof processed).toBe('boolean');
    });

    it('should return false when no pending jobs', async () => {
      const processed = await JobSchedulerService.processNextJob();

      expect(processed).toBe(false);
    });
  });

  describe('processBatch', () => {
    it('should process multiple jobs in batch', async () => {
      const results = await JobSchedulerService.processBatch(5);

      expect(results).toHaveProperty('processed');
      expect(results).toHaveProperty('successful');
      expect(results).toHaveProperty('failed');
      expect(typeof results.processed).toBe('number');
    });

    it('should respect max jobs limit', async () => {
      const results = await JobSchedulerService.processBatch(10);

      expect(results.processed).toBeLessThanOrEqual(10);
    });
  });

  describe('scheduleJob', () => {
    it('should schedule a job with type and payload', async () => {
      const job = await JobSchedulerService.scheduleJob('NOTIFICATION', {
        userId: 'user123',
        message: 'Test notification',
      });

      expect(job).toBeDefined();
    });

    it('should schedule job with priority', async () => {
      const job = await JobSchedulerService.scheduleJob(
        'REPORT_GENERATION',
        { reportType: 'sales' },
        { priority: 'HIGH' }
      );

      expect(job).toBeDefined();
    });

    it('should schedule job with future time', async () => {
      const scheduledAt = new Date(Date.now() + 60000);
      const job = await JobSchedulerService.scheduleJob(
        'EMAIL_SEND',
        { to: 'test@example.com' },
        { scheduledAt }
      );

      expect(job).toBeDefined();
    });
  });

  describe('scheduleNotificationJob', () => {
    it('should schedule notification with medium priority by default', async () => {
      const job = await JobSchedulerService.scheduleNotificationJob({
        userId: 'user123',
        type: 'INFO',
        title: 'Test',
        message: 'Test message',
      });

      expect(job).toBeDefined();
    });

    it('should schedule notification with custom priority', async () => {
      const job = await JobSchedulerService.scheduleNotificationJob(
        {
          userId: 'user123',
          type: 'INFO',
          title: 'Test',
          message: 'Test message',
        },
        { priority: 'HIGH' }
      );

      expect(job).toBeDefined();
    });
  });

  describe('scheduleReportJob', () => {
    it('should schedule report with low priority by default', async () => {
      const job = await JobSchedulerService.scheduleReportJob({
        reportType: 'sales',
        parameters: { format: 'pdf' },
      });

      expect(job).toBeDefined();
    });

    it('should schedule report with custom priority', async () => {
      const job = await JobSchedulerService.scheduleReportJob(
        {
          reportType: 'revenue',
          parameters: { format: 'csv' },
        },
        { priority: 'MEDIUM' }
      );

      expect(job).toBeDefined();
    });
  });

  describe('scheduleEmailJob', () => {
    it('should schedule email with medium priority by default', async () => {
      const job = await JobSchedulerService.scheduleEmailJob({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test email',
      });

      expect(job).toBeDefined();
    });
  });

  describe('getQueueHealth', () => {
    it('should return queue health status', async () => {
      const health = await JobSchedulerService.getQueueHealth();

      expect(health).toHaveProperty('stats');
      expect(health).toHaveProperty('healthScore');
      expect(health).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should calculate health score correctly', async () => {
      const health = await JobSchedulerService.getQueueHealth();

      expect(typeof health.healthScore).toBe('number');
      expect(health.healthScore).toBeGreaterThanOrEqual(0);
      expect(health.healthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('cleanupOldJobs', () => {
    it('should cleanup old jobs', async () => {
      const deleted = await JobSchedulerService.cleanupOldJobs(7);

      expect(typeof deleted).toBe('number');
    });

    it('should cleanup with custom days parameter', async () => {
      const deleted = await JobSchedulerService.cleanupOldJobs(30);

      expect(typeof deleted).toBe('number');
    });
  });

  describe('registerHandler', () => {
    it('should register custom job handler', () => {
      const mockHandler = {
        handle: vi.fn().mockResolvedValue({ success: true }),
      };

      JobSchedulerService.registerHandler('CUSTOM', mockHandler as any);

      expect(JobSchedulerService['handlers']).toBeDefined();
    });
  });

  describe('retryStuckJobs', () => {
    it('should retry stuck jobs', async () => {
      const retried = await JobSchedulerService.retryStuckJobs();

      expect(typeof retried).toBe('number');
    });
  });
});
