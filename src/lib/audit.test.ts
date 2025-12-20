import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from './audit';

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('AuditService', () => {
  let auditService: AuditService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      auditLog: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
    };

    auditService = new AuditService(mockDb);
  });

  describe('log', () => {
    it('should create audit log with correct data', async () => {
      const auditLog: any = {
        action: 'CREATE',
        resource: 'project',
        ipAddress: 'unknown',
        userAgent: 'unknown',
      };

      auditLog.user = { connect: { id: 'user-123' } };
      auditLog.resourceId = 'project-456';
      auditLog.newValues = { name: 'Test Project' };

      await auditService.log({
        userId: 'user-123',
        action: 'CREATE',
        resource: 'project',
        resourceId: 'project-456',
        newValues: { name: 'Test Project' },
      });

      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: auditLog,
      });
    });

    it('should handle log failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDb.auditLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(auditService.log({
        action: 'CREATE',
        resource: 'test',
      })).resolves.toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create audit log:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('logWithRequest', () => {
    it('should extract IP and user agent from request', async () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      const expectedLog: any = {
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      expectedLog.user = { connect: { id: 'user-123' } };

      await auditService.logWithRequest({
        userId: 'user-123',
        action: 'LOGIN',
        resource: 'auth',
      }, mockRequest);

      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expectedLog,
      });
    });

    it('should fallback to unknown when headers missing', async () => {
      const mockRequest = new Request('http://localhost');

      const expectedLog: any = {
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: 'unknown',
        userAgent: 'unknown',
      };

      await auditService.logWithRequest({
        action: 'LOGIN',
        resource: 'auth',
      }, mockRequest);

      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expectedLog,
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          resource: 'project',
          oldValues: null,
          newValues: '{"name": "Test"}',
          timestamp: new Date(),
        },
      ];

      mockDb.auditLog.findMany.mockResolvedValue(mockLogs);
      mockDb.auditLog.count.mockResolvedValue(1);

      const result = await auditService.getAuditLogs({
        userId: 'user-1',
        action: 'CREATE',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        logs: [
          {
            ...mockLogs[0],
            newValues: { name: 'Test' },
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should build correct where clause with date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockDb.auditLog.findMany.mockResolvedValue([]);
      mockDb.auditLog.count.mockResolvedValue(0);

      await auditService.getAuditLogs({
        startDate,
        endDate,
        page: 1,
        limit: 10,
      });

      expect(mockDb.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getAuditLogById', () => {
    it('should return single audit log with parsed JSON', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        action: 'UPDATE',
        resource: 'user',
        oldValues: '{"role": "client"}',
        newValues: '{"role": "admin"}',
        timestamp: new Date(),
      };

      mockDb.auditLog.findUnique.mockResolvedValue(mockLog);

      const result = await auditService.getAuditLogById('log-1');

      expect(result).toEqual({
        ...mockLog,
        oldValues: { role: 'client' },
        newValues: { role: 'admin' },
      });
    });

    it('should return null for non-existent log', async () => {
      mockDb.auditLog.findUnique.mockResolvedValue(null);

      const result = await auditService.getAuditLogById('non-existent');

      expect(result).toBeNull();
    });
  });
});