/**
 * Tests for Webhook Queue Service
 * Tests webhook queue management, retry logic, and statistics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookQueueService } from '@/services/webhook-queue.service';

// Mock Prisma client
const mockPrisma = {
  webhookQueue: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
};

describe('WebhookQueueService', () => {
  let service: WebhookQueueService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WebhookQueueService(mockPrisma as any);
  });

  describe('enqueue', () => {
    it('should enqueue a webhook successfully', async () => {
      const options = {
        provider: 'midtrans',
        eventType: 'payment_notification',
        payload: { order_id: 'ORD123', status: 'paid' },
        signature: 'sig123',
        eventId: 'ORD123',
        maxRetries: 3,
        ttlSeconds: 3600,
      };

      const expectedWebhook = {
        id: 'webhook-1',
        provider: 'midtrans',
        eventType: 'payment_notification',
        payload: { order_id: 'ORD123', status: 'paid' },
        signature: 'sig123',
        eventId: 'ORD123',
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 3,
        lastError: null,
        processedAt: null,
      };

      mockPrisma.webhookQueue.create.mockResolvedValue(expectedWebhook as any);

      const result = await service.enqueue(options);

      expect(mockPrisma.webhookQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: options.provider,
          eventType: options.eventType,
          payload: options.payload,
          signature: options.signature,
          eventId: options.eventId,
          maxRetries: options.maxRetries,
        }),
      });

      expect(result).toEqual(expectedWebhook);
    });

    it('should use default values when not provided', async () => {
      const options = {
        provider: 'midtrans',
        eventType: 'payment_notification',
        payload: { order_id: 'ORD123' },
      };

      mockPrisma.webhookQueue.create.mockResolvedValue({ id: 'webhook-1' } as any);

      await service.enqueue(options);

      const createCall = mockPrisma.webhookQueue.create.mock.calls[0][0];
      expect(createCall.data.maxRetries).toBe(5);
      expect(createCall.data.retryCount).toBe(0);
      expect(createCall.data.lastError).toBeNull();
    });
  });

  describe('enqueueWithDeduplication', () => {
    it('should return existing webhook if already enqueued', async () => {
      const existingWebhook = { id: 'existing-1', status: 'PENDING' };
      mockPrisma.webhookQueue.findFirst.mockResolvedValue(existingWebhook as any);

      const options = {
        provider: 'midtrans',
        eventType: 'payment_notification',
        payload: { order_id: 'ORD123' },
        eventId: 'ORD123',
      };

      const result = await service.enqueueWithDeduplication(options);

      expect(mockPrisma.webhookQueue.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          provider: 'midtrans',
          eventId: 'ORD123',
          status: { in: ['PENDING', 'PROCESSING'] },
        }),
      });

      expect(result).toEqual(existingWebhook);
      expect(mockPrisma.webhookQueue.create).not.toHaveBeenCalled();
    });

    it('should enqueue new webhook if no duplicate found', async () => {
      mockPrisma.webhookQueue.findFirst.mockResolvedValue(null);
      mockPrisma.webhookQueue.create.mockResolvedValue({ id: 'new-1' } as any);

      const options = {
        provider: 'midtrans',
        eventType: 'payment_notification',
        payload: { order_id: 'ORD123' },
        eventId: 'ORD123',
      };

      const result = await service.enqueueWithDeduplication(options);

      expect(mockPrisma.webhookQueue.create).toHaveBeenCalled();
      expect(result.id).toBe('new-1');
    });

    it('should enqueue webhook without eventId for deduplication', async () => {
      mockPrisma.webhookQueue.create.mockResolvedValue({ id: 'new-1' } as any);

      const options = {
        provider: 'midtrans',
        eventType: 'payment_notification',
        payload: { order_id: 'ORD123' },
      };

      await service.enqueueWithDeduplication(options);

      expect(mockPrisma.webhookQueue.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.webhookQueue.create).toHaveBeenCalled();
    });
  });

  describe('getNextPendingWebhooks', () => {
    it('should return pending webhooks ordered by creation time and retry count', async () => {
      const webhooks = [
        { id: 'webhook-1', createdAt: new Date('2024-01-01'), retryCount: 2 },
        { id: 'webhook-2', createdAt: new Date('2024-01-02'), retryCount: 0 },
        { id: 'webhook-3', createdAt: new Date('2024-01-02'), retryCount: 1 },
      ];

      mockPrisma.webhookQueue.findMany.mockResolvedValue(webhooks as any);

      const result = await service.getNextPendingWebhooks(10);

      expect(mockPrisma.webhookQueue.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'PENDING',
        }),
        orderBy: [
          { createdAt: 'asc' },
          { retryCount: 'asc' },
        ],
        take: 10,
      });

      expect(result).toEqual(webhooks);
    });

    it('should filter out expired webhooks', async () => {
      mockPrisma.webhookQueue.findMany.mockResolvedValue([] as any);

      await service.getNextPendingWebhooks(10);

      expect(mockPrisma.webhookQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: { gt: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('markProcessing', () => {
    it('should mark webhook as processing', async () => {
      mockPrisma.webhookQueue.update.mockResolvedValue({ id: 'webhook-1' } as any);

      await service.markProcessing('webhook-1');

      expect(mockPrisma.webhookQueue.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: { status: 'PROCESSING' },
      });
    });
  });

  describe('markCompleted', () => {
    it('should mark webhook as completed with processed timestamp', async () => {
      mockPrisma.webhookQueue.update.mockResolvedValue({ id: 'webhook-1' } as any);

      await service.markCompleted('webhook-1');

      expect(mockPrisma.webhookQueue.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          processedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('markFailed', () => {
    it('should mark webhook as failed when max retries exceeded', async () => {
      const webhook = {
        id: 'webhook-1',
        retryCount: 5,
        maxRetries: 5,
      };

      mockPrisma.webhookQueue.findUnique.mockResolvedValue(webhook as any);
      mockPrisma.webhookQueue.update.mockResolvedValue(webhook as any);

      const shouldRetry = await service.markFailed('webhook-1', new Error('Test error'));

      expect(shouldRetry).toBe(false);
      expect(mockPrisma.webhookQueue.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: {
          status: 'FAILED',
          lastError: 'Test error',
          retryCount: 6,
        },
      });
    });

    it('should increment retry count and set status to pending for retry', async () => {
      const webhook = {
        id: 'webhook-1',
        retryCount: 2,
        maxRetries: 5,
      };

      mockPrisma.webhookQueue.findUnique.mockResolvedValue(webhook as any);
      mockPrisma.webhookQueue.update.mockResolvedValue(webhook as any);

      const shouldRetry = await service.markFailed('webhook-1', new Error('Test error'));

      expect(shouldRetry).toBe(true);
      expect(mockPrisma.webhookQueue.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: {
          status: 'PENDING',
          lastError: 'Test error',
          retryCount: 3,
        },
      });
    });

    it('should calculate exponential backoff delay', async () => {
      const webhook = {
        id: 'webhook-1',
        retryCount: 1,
        maxRetries: 5,
      };

      mockPrisma.webhookQueue.findUnique.mockResolvedValue(webhook as any);
      mockPrisma.webhookQueue.update.mockResolvedValue(webhook as any);

      const startTime = Date.now();
      await service.markFailed('webhook-1', new Error('Test error'));
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(1000);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('getStats', () => {
    it('should return webhook queue statistics', async () => {
      const mockStats = [
        { status: 'PENDING', _count: { id: 10 } },
        { status: 'PROCESSING', _count: { id: 2 } },
        { status: 'COMPLETED', _count: { id: 100 } },
        { status: 'FAILED', _count: { id: 5 } },
        { status: 'EXPIRED', _count: { id: 3 } },
      ];

      mockPrisma.webhookQueue.groupBy.mockResolvedValue(mockStats as any);
      mockPrisma.webhookQueue.aggregate.mockResolvedValue({
        _avg: { createdAt: new Date('2024-01-01') },
      } as any);

      const stats = await service.getStats();

      expect(stats.pending).toBe(10);
      expect(stats.processing).toBe(2);
      expect(stats.completed).toBe(100);
      expect(stats.failed).toBe(5);
      expect(stats.expired).toBe(3);
      expect(stats.total).toBe(120);
      expect(stats.successRate).toBe(100 / 120);
      expect(stats.averageProcessingTimeMs).toBeGreaterThan(0);
    });

    it('should return zero stats when no webhooks', async () => {
      mockPrisma.webhookQueue.groupBy.mockResolvedValue([]);
      mockPrisma.webhookQueue.aggregate.mockResolvedValue({
        _avg: { createdAt: null },
      } as any);

      const stats = await service.getStats();

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageProcessingTimeMs).toBe(0);
    });
  });

  describe('retryFailedWebhooks', () => {
    it('should retry failed webhooks', async () => {
      mockPrisma.webhookQueue.updateMany.mockResolvedValue({ count: 2 } as any);

      const retried = await service.retryFailedWebhooks(['webhook-1', 'webhook-2']);

      expect(retried).toBe(2);
      expect(mockPrisma.webhookQueue.updateMany).toHaveBeenCalledTimes(1);

      const updateCall = mockPrisma.webhookQueue.updateMany.mock.calls[0][0];
      expect(updateCall.where.id).toEqual({ in: ['webhook-1', 'webhook-2'] });
      expect(updateCall.where.status).toBe('FAILED');
      expect(updateCall.data).toEqual({
        status: 'PENDING',
        retryCount: 0,
        lastError: null,
      });
    });

    it('should skip webhooks that are not failed', async () => {
      mockPrisma.webhookQueue.updateMany.mockResolvedValue({ count: 0 } as any);

      const retried = await service.retryFailedWebhooks(['webhook-1', 'webhook-2']);

      expect(retried).toBe(0);
      expect(mockPrisma.webhookQueue.updateMany).toHaveBeenCalledTimes(1);

      const updateCall = mockPrisma.webhookQueue.updateMany.mock.calls[0][0];
      expect(updateCall.where.id).toEqual({ in: ['webhook-1', 'webhook-2'] });
      expect(updateCall.where.status).toBe('FAILED');
    });
  });

  describe('cleanupOldWebhooks', () => {
    it('should delete old completed and failed webhooks', async () => {
      mockPrisma.webhookQueue.deleteMany.mockResolvedValue({ count: 50 } as any);

      const count = await service.cleanupOldWebhooks(7);

      expect(count).toBe(50);
      
      const whereClause = mockPrisma.webhookQueue.deleteMany.mock.calls[0][0].where;
      expect(whereClause.status).toEqual({ in: ['COMPLETED', 'FAILED', 'EXPIRED'] });
      expect(whereClause.createdAt).toHaveProperty('lt');
    });

    it('should use default days old value', async () => {
      mockPrisma.webhookQueue.deleteMany.mockResolvedValue({ count: 0 } as any);

      await service.cleanupOldWebhooks();

      expect(mockPrisma.webhookQueue.deleteMany).toHaveBeenCalled();
    });
  });

  describe('markExpiredWebhooks', () => {
    it('should mark expired webhooks', async () => {
      mockPrisma.webhookQueue.updateMany.mockResolvedValue({ count: 10 } as any);

      const count = await service.markExpiredWebhooks();

      expect(count).toBe(10);
      
      const whereClause = mockPrisma.webhookQueue.updateMany.mock.calls[0][0].where;
      expect(whereClause.status).toEqual({ in: ['PENDING', 'PROCESSING'] });
      expect(whereClause.expiresAt).toHaveProperty('lt');
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff with jitter', async () => {
      const webhook = {
        id: 'webhook-1',
        retryCount: 2,
        maxRetries: 5,
      };

      mockPrisma.webhookQueue.findUnique.mockResolvedValue(webhook as any);
      mockPrisma.webhookQueue.update.mockResolvedValue(webhook as any);

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = ((cb: () => void, ms: number) => {
        delays.push(ms);
        return originalSetTimeout(cb, ms) as never;
      }) as any;

      try {
        await service.markFailed('webhook-1', new Error('Test error'));

        expect(delays.length).toBe(1);
        const delay = delays[0];
        expect(delay).toBeGreaterThan(1000 * Math.pow(2, 2 - 1));
        expect(delay).toBeLessThan(1000 * Math.pow(2, 2 - 1) * 2);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });
});
