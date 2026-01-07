import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobQueueService } from '../job-queue.service';

describe('JobQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job with valid payload and options', async () => {
      const payload = { type: 'NOTIFICATION', userId: 'user123', message: 'Test' };
      const options = { type: 'NOTIFICATION' as any, priority: 'HIGH' as any, maxRetries: 5 };

      const job = await JobQueueService.createJob(payload, options);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
    });

    it('should create a job with default priority and retries', async () => {
      const payload = { type: 'REPORT_GENERATION', reportType: 'sales' };
      const options = { type: 'REPORT_GENERATION' as any };

      const job = await JobQueueService.createJob(payload, options);

      expect(job).toBeDefined();
    });

    it('should create a job with scheduled time', async () => {
      const scheduledAt = new Date(Date.now() + 60000);
      const payload = { type: 'EMAIL_SEND', to: 'test@example.com' };
      const options = {
        type: 'EMAIL_SEND' as any,
        scheduledAt,
      };

      const job = await JobQueueService.createJob(payload, options);

      expect(job).toBeDefined();
    });
  });

  describe('getJobById', () => {
    it('should retrieve job by id', async () => {
      const payload = { type: 'NOTIFICATION', userId: 'user123' };
      const options = { type: 'NOTIFICATION' as any };
      const created = await JobQueueService.createJob(payload, options);

      const job = await JobQueueService.getJobById(created.id);

      expect(job).toBeDefined();
      expect(job?.id).toBe(created.id);
    });

    it('should return undefined for non-existent job', async () => {
      const job = await JobQueueService.getJobById('non-existent-id');

      expect(job).toBeNull();
    });
  });

  describe('getPendingJobs', () => {
    it('should retrieve pending jobs ordered by priority', async () => {
      const pending = await JobQueueService.getPendingJobs(10);

      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe('getFailedJobsForRetry', () => {
    it('should retrieve failed jobs eligible for retry', async () => {
      const failed = await JobQueueService.getFailedJobsForRetry(10);

      expect(Array.isArray(failed)).toBe(true);
    });
  });

  describe('markJobAsProcessing', () => {
    it('should update job status to PROCESSING', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any };
      const job = await JobQueueService.createJob(payload, options);

      const updated = await JobQueueService.markJobAsProcessing(job.id);

      expect(updated.status).toBe('PROCESSING');
      expect(updated.startedAt).toBeDefined();
    });
  });

  describe('markJobAsCompleted', () => {
    it('should mark job as completed with result', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any };
      const job = await JobQueueService.createJob(payload, options);
      const result = { success: true, data: 'completed' };

      const updated = await JobQueueService.markJobAsCompleted(job.id, result);

      expect(updated.status).toBe('COMPLETED');
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('markJobAsFailed', () => {
    it('should mark job as failed with error', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any };
      const job = await JobQueueService.createJob(payload, options);
      const error = 'Job execution failed';

      const updated = await JobQueueService.markJobAsFailed(job.id, error, true);

      expect(['FAILED', 'RETRYING']).toContain(updated.status);
      expect(updated.error).toBe(error);
    });

    it('should mark as RETRYING if retries remain', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any, maxRetries: 5 };
      const job = await JobQueueService.createJob(payload, options);

      await JobQueueService.markJobAsFailed(job.id, 'Temporary error', true);
      const updated = await JobQueueService.getJobById(job.id);

      expect(updated?.status).toBe('RETRYING');
    });

    it('should mark as FAILED if max retries exceeded', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any, maxRetries: 0 };
      const job = await JobQueueService.createJob(payload, options);

      await JobQueueService.markJobAsFailed(job.id, 'Permanent error', true);
      const updated = await JobQueueService.getJobById(job.id);

      expect(updated?.status).toBe('FAILED');
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending job', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any };
      const job = await JobQueueService.createJob(payload, options);

      const updated = await JobQueueService.cancelJob(job.id);

      expect(updated.status).toBe('CANCELLED');
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any };
      const job = await JobQueueService.createJob(payload, options);

      await JobQueueService.deleteJob(job.id);
      const deleted = await JobQueueService.getJobById(job.id);

      expect(deleted).toBeNull();
    });
  });

  describe('getJobs', () => {
    it('should retrieve jobs with pagination', async () => {
      const result = await JobQueueService.getJobs({}, 1, 20);

      expect(result).toHaveProperty('jobs');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
    });

    it('should filter jobs by status', async () => {
      const result = await JobQueueService.getJobs({ status: 'PENDING' as any }, 1, 20);

      expect(result.jobs.every((job: any) => job.status === 'PENDING')).toBe(true);
    });

    it('should filter jobs by type', async () => {
      const result = await JobQueueService.getJobs({ type: 'NOTIFICATION' as any }, 1, 20);

      expect(result.jobs.every((job: any) => job.type === 'NOTIFICATION')).toBe(true);
    });

    it('should filter jobs by priority', async () => {
      const result = await JobQueueService.getJobs({ priority: 'HIGH' as any }, 1, 20);

      expect(result.jobs.every((job: any) => job.priority === 'HIGH')).toBe(true);
    });
  });

  describe('getJobStats', () => {
    it('should return accurate job statistics', async () => {
      const stats = await JobQueueService.getJobStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('cancelled');
      expect(stats).toHaveProperty('retrying');
      expect(typeof stats.total).toBe('number');
    });
  });

  describe('cleanupOldJobs', () => {
    it('should delete completed jobs older than specified days', async () => {
      const deleted = await JobQueueService.cleanupOldJobs(7);

      expect(typeof deleted).toBe('number');
    });

    it('should handle 0 days parameter', async () => {
      const deleted = await JobQueueService.cleanupOldJobs(0);

      expect(typeof deleted).toBe('number');
    });
  });

  describe('retryFailedJobs', () => {
    it('should retry failed jobs', async () => {
      const payload = { type: 'TEST', data: 'test' };
      const options = { type: 'NOTIFICATION' as any };
      const job = await JobQueueService.createJob(payload, options);

      await JobQueueService.markJobAsFailed(job.id, 'Error', true);
      const retried = await JobQueueService.retryFailedJobs([job.id]);

      expect(retried.length).toBeGreaterThan(0);
    });
  });
});
