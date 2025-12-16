import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardGateway } from '../src/dashboard/dashboard.gateway';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { MultiTenantPrismaService } from '../src/common/database/multi-tenant-prisma.service';

describe('DashboardGateway', () => {
  let gateway: DashboardGateway;
  let mockCacheManager: Partial<Cache>;
  let mockJwtService: Partial<JwtService>;
  let mockPrismaService: Partial<MultiTenantPrismaService>;
  let mockClient: any;
  let mockServer: any;

  beforeEach(() => {
    mockCacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    mockJwtService = {
      verify: vi.fn(),
      verifyAsync: vi.fn(),
    } as any;

    mockPrismaService = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      } as any,
      project: {
        findMany: vi.fn(),
      } as any,
      ticket: {
        findMany: vi.fn(),
      } as any,
      invoice: {
        findMany: vi.fn(),
      } as any,
      milestone: {
        findMany: vi.fn(),
      } as any,
    } as any;

    mockClient = {
      id: 'test-client-id',
      handshake: {
        auth: {
          token: 'test-token',
        },
        headers: {},
      },
      join: vi.fn(),
      leave: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };

    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    gateway = new DashboardGateway(
      mockCacheManager as Cache,
      mockJwtService as JwtService,
      mockPrismaService as MultiTenantPrismaService
    );

    gateway['server'] = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate client with valid token', async () => {
      const payload = {
        sub: 'user-123',
        organizationId: 'org-123',
        role: 'owner',
      };

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockPrismaService.user as any).findMany.mockResolvedValue([
        {
          id: 'user-123',
          email: 'test@example.com',
          memberships: [{ organizationId: 'org-123', role: 'owner' }],
        },
      ]);

      // Mock dashboard stats
      (mockCacheManager.get as jest.Mock).mockResolvedValue({
        projects: { total: 5, active: 3, completed: 2, onHold: 0 },
        tickets: {
          total: 10,
          open: 4,
          inProgress: 3,
          highPriority: 2,
          critical: 1,
        },
        invoices: {
          total: 3,
          pending: 1,
          overdue: 0,
          totalAmount: 15000,
          pendingAmount: 5000,
        },
        milestones: { total: 8, completed: 5, overdue: 1, dueThisWeek: 2 },
      });

      // Mock recent activity
      jest.spyOn(gateway, 'getRecentActivity' as any).mockResolvedValue([
        {
          type: 'project',
          id: 'p1',
          title: 'Test Project',
          timestamp: new Date(),
        },
        {
          type: 'ticket',
          id: 't1',
          title: 'Test Ticket',
          timestamp: new Date(),
        },
      ]);

      await gateway.handleConnection(mockClient);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('test-token');
      expect(mockClient.join).toHaveBeenCalledWith('org-org-123');
      expect(mockClient.join).toHaveBeenCalledWith('user-user-123');
      expect(mockClient.emit).toHaveBeenCalledWith(
        'initial-data',
        expect.any(Object)
      );
    });

    it('should reject connection with invalid token', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication failed',
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should reject connection without token', async () => {
      mockClient.handshake.auth.token = null;

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication failed',
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleSubscribeDashboard', () => {
    beforeEach(() => {
      mockClient.organizationId = 'org-123';
    });

    it('should subscribe to dashboard updates', async () => {
      await gateway.handleSubscribeDashboard(
        { organizationId: 'org-123' },
        mockClient
      );

      expect(mockClient.join).toHaveBeenCalledWith('org-org-123');
      expect(mockClient.emit).toHaveBeenCalledWith('subscribed', {
        room: 'org-org-123',
      });
    });

    it('should reject subscription to different organization', async () => {
      await expect(
        gateway.handleSubscribeDashboard(
          { organizationId: 'different-org' },
          mockClient
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('broadcastDashboardUpdate', () => {
    it('should broadcast update to organization room', async () => {
      const payload = {
        type: 'stats' as const,
        data: { test: 'data' },
        timestamp: new Date(),
        organizationId: 'org-123',
      };

      await gateway.broadcastDashboardUpdate(payload);

      expect(mockServer.to).toHaveBeenCalledWith('org-org-123');
      expect(mockServer.emit).toHaveBeenCalledWith('dashboard-update', {
        type: 'stats',
        data: { test: 'data' },
        timestamp: payload.timestamp,
      });
    });

    it('should also broadcast to user room if userId is present', async () => {
      const payload = {
        type: 'ticket' as const,
        data: { userId: 'user-123', test: 'data' },
        timestamp: new Date(),
        organizationId: 'org-123',
      };

      await gateway.broadcastDashboardUpdate(payload);

      expect(mockServer.to).toHaveBeenCalledWith('org-org-123');
      expect(mockServer.to).toHaveBeenCalledWith('user-user-123');
    });
  });

  describe('getDashboardStats', () => {
    it('should return cached stats if available', async () => {
      const cachedStats = {
        projects: { total: 5, active: 3, completed: 2, onHold: 0 },
        tickets: {
          total: 10,
          open: 4,
          inProgress: 3,
          highPriority: 2,
          critical: 1,
        },
        invoices: {
          total: 3,
          pending: 1,
          overdue: 0,
          totalAmount: 15000,
          pendingAmount: 5000,
        },
        milestones: { total: 8, completed: 5, overdue: 1, dueThisWeek: 2 },
      };

      (mockCacheManager.get as jest.Mock).mockResolvedValue(cachedStats);

      const result = await gateway['getDashboardStats']('org-123');

      expect(result).toEqual(cachedStats);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'dashboard-stats-org-123'
      );
      expect(
        (mockPrismaService.project as any).findMany
      ).not.toHaveBeenCalled();
    });

    it('should fetch fresh stats if not cached', async () => {
      const projectsData = [{ status: 'active' }, { status: 'completed' }];
      const ticketsData = [{ status: 'open', priority: 'high' }];
      const invoicesData = [
        { status: 'issued', amount: 5000, dueAt: new Date() },
      ];
      const milestonesData = [{ status: 'completed', dueAt: new Date() }];

      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.project as any).findMany.mockResolvedValue(
        projectsData
      );
      (mockPrismaService.ticket as any).findMany.mockResolvedValue(ticketsData);
      (mockPrismaService.invoice as any).findMany.mockResolvedValue(
        invoicesData
      );
      (mockPrismaService.milestone as any).findMany.mockResolvedValue(
        milestonesData
      );

      const result = await gateway['getDashboardStats']('org-123');

      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('milestones');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard-stats-org-123',
        expect.any(Object),
        120000
      );
    });
  });

  describe('getRecentActivity', () => {
    it('should combine and sort recent activities', async () => {
      const projectsData = [
        {
          id: 'p1',
          name: 'Project 1',
          status: 'active',
          updatedAt: new Date('2023-01-01'),
        },
      ];
      const ticketsData = [
        {
          id: 't1',
          type: 'bug',
          priority: 'high',
          status: 'open',
          createdAt: new Date('2023-01-02'),
        },
      ];
      const milestonesData = [
        {
          id: 'm1',
          title: 'Milestone 1',
          status: 'completed',
          createdAt: new Date('2023-01-03'),
        },
      ];
      const invoicesData = [
        {
          id: 'i1',
          status: 'issued',
          amount: 1000,
          createdAt: new Date('2023-01-04'),
        },
      ];

      (mockPrismaService.project as any).findMany.mockResolvedValue(
        projectsData
      );
      (mockPrismaService.ticket as any).findMany.mockResolvedValue(ticketsData);
      (mockPrismaService.milestone as any).findMany.mockResolvedValue(
        milestonesData
      );
      (mockPrismaService.invoice as any).findMany.mockResolvedValue(
        invoicesData
      );

      const result = await gateway['getRecentActivity']('org-123', 10);

      expect(result).toHaveLength(4);
      expect(result[0]?.type).toBe('invoice'); // Most recent
      expect(result[3]?.type).toBe('project'); // Oldest
    });
  });
});
