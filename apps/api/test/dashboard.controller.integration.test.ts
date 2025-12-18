import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { MultiTenantPrismaService } from '../src/common/database/multi-tenant-prisma.service';
import { PrismaService } from '../src/common/database/prisma.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardGateway } from '../src/dashboard/dashboard.gateway';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('DashboardController Integration Tests', () => {
  let controller: DashboardController;
  let prismaService: MultiTenantPrismaService;
  let cacheManager: Cache;
  let dashboardGateway: DashboardGateway;

  const mockOrganizationId = 'org-1';
  const mockUserId = 'user-1';

  const mockPrismaService = {
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    milestone: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockDashboardGateway = {
    broadcastDashboardUpdate: jest.fn(),
  };

  const mockGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: mockUserId, organizationId: mockOrganizationId };
      return true;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PrismaService,
          useValue: {
            membership: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: DashboardGateway,
          useValue: mockDashboardGateway,
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    prismaService = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dashboardGateway = module.get<DashboardGateway>(DashboardGateway);

    jest.clearAllMocks();
  });

  describe('GET /dashboard/stats', () => {
    it('should return dashboard statistics for organization', async () => {
      const mockStats = {
        projects: { total: 5, active: 3, completed: 2, onHold: 0 },
        tickets: {
          total: 12,
          open: 8,
          inProgress: 3,
          highPriority: 2,
          critical: 1,
        },
        invoices: {
          total: 8,
          pending: 3,
          overdue: 1,
          totalAmount: 25000,
          pendingAmount: 8000,
        },
        milestones: {
          total: 15,
          completed: 10,
          overdue: 2,
          dueThisWeek: 3,
        },
      };

      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);

      // Mock Prisma responses
      mockPrismaService.project.findMany.mockResolvedValue([
        { status: 'active' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'in-progress' },
        { status: 'on-hold' },
      ]);

      mockPrismaService.ticket.findMany.mockResolvedValue([
        { status: 'open', priority: 'high' },
        { status: 'open', priority: 'medium' },
        { status: 'in-progress', priority: 'critical' },
        { status: 'open', priority: 'low' },
      ]);

      mockPrismaService.invoice.findMany.mockResolvedValue([
        { status: 'issued', amount: 5000, dueAt: new Date() },
        { status: 'paid', amount: 10000, dueAt: new Date() },
        { status: 'draft', amount: 3000, dueAt: new Date() },
      ]);

      mockPrismaService.milestone.findMany.mockResolvedValue([
        { status: 'completed', dueAt: new Date() },
        { status: 'completed', dueAt: new Date() },
        { status: 'in-progress', dueAt: new Date() },
      ]);

      const result = await controller.getDashboardStats(mockOrganizationId);

      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('milestones');
      expect(result.projects.total).toBe(5);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}`,
        expect.any(Object),
        300000
      );
    });

    it('should return cached stats when available', async () => {
      const cachedStats = {
        projects: { total: 3, active: 2, completed: 1, onHold: 0 },
        tickets: {
          total: 5,
          open: 3,
          inProgress: 2,
          highPriority: 1,
          critical: 0,
        },
        invoices: {
          total: 2,
          pending: 1,
          overdue: 0,
          totalAmount: 10000,
          pendingAmount: 5000,
        },
        milestones: { total: 6, completed: 4, overdue: 1, dueThisWeek: 1 },
      };

      mockCacheManager.get.mockResolvedValue(cachedStats);

      const result = await controller.getDashboardStats(mockOrganizationId);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}`
      );
      expect(result).toEqual(cachedStats);
      expect(prismaService.project.findMany).not.toHaveBeenCalled();
    });

    it('should force refresh when refresh parameter is true', async () => {
      mockCacheManager.get.mockResolvedValue({ some: 'cached data' });
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);

      await controller.getDashboardStats(mockOrganizationId, 'true');

      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(prismaService.project.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /dashboard/recent-activity', () => {
    it('should return recent activity for organization', async () => {
      const mockProjects = [
        {
          id: 'p1',
          name: 'Test Project',
          status: 'active',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-10'),
        },
      ];

      const mockTickets = [
        {
          id: 't1',
          type: 'bug',
          priority: 'high',
          status: 'open',
          createdAt: new Date('2023-12-09'),
        },
      ];

      const mockMilestones = [
        {
          id: 'm1',
          title: 'Test Milestone',
          status: 'completed',
          dueAt: new Date('2023-12-08'),
          createdAt: new Date('2023-12-05'),
        },
      ];

      const mockInvoices = [
        {
          id: 'i1',
          status: 'issued',
          amount: 1000,
          dueAt: new Date('2023-12-15'),
          createdAt: new Date('2023-12-07'),
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrismaService.milestone.findMany.mockResolvedValue(mockMilestones);
      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await controller.getRecentActivity(mockOrganizationId, {
        limit: '10',
      });

      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('project'); // Most recent (updated 2023-12-10)
      expect(result[1].type).toBe('ticket'); // Created 2023-12-09
      expect(result[2].type).toBe('invoice'); // Created 2023-12-07
      expect(result[3].type).toBe('milestone'); // Created 2023-12-05
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      await controller.getRecentActivity(mockOrganizationId, { limit: '5' });

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }) // Math.ceil(5/4) = 2
      );
    });

    it('should cap limit at 50', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findResolved([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      await controller.getRecentActivity(mockOrganizationId, { limit: '100' });

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 13 }) // Math.ceil(50/4) = 13
      );
    });
  });

  describe('GET /dashboard/projects-overview', () => {
    it('should return projects overview with metrics', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          status: 'in_progress',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-10'),
          startAt: new Date('2023-12-01'),
          dueAt: new Date('2023-12-31'),
          milestones: [
            { id: 'm1', status: 'completed', dueAt: new Date('2023-12-15') },
            { id: 'm2', status: 'in-progress', dueAt: new Date('2023-12-30') },
          ],
          tickets: [
            { id: 't1', status: 'open', priority: 'high' },
            { id: 't2', status: 'closed', priority: 'low' },
          ],
          _count: {
            milestones: 2,
            tickets: 2,
          },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await controller.getProjectsOverview(mockOrganizationId, {
        limit: '6',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'project-1',
        name: 'Test Project',
        status: 'in_progress',
        progress: 50, // 1 completed out of 2 milestones
        totalMilestones: 2,
        completedMilestones: 1,
        openTickets: 1,
        highPriorityTickets: 1,
      });
    });

    it('should handle projects without milestones or tickets', async () => {
      const mockProjects = [
        {
          id: 'project-2',
          name: 'Empty Project',
          status: 'planning',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-10'),
          startAt: null,
          dueAt: null,
          milestones: [],
          tickets: [],
          _count: {
            milestones: 0,
            tickets: 0,
          },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await controller.getProjectsOverview(mockOrganizationId);

      expect(result[0]).toMatchObject({
        progress: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        openTickets: 0,
        highPriorityTickets: 0,
      });
    });
  });

  describe('POST /dashboard/notify-update', () => {
    it('should broadcast dashboard update notification', async () => {
      const body = {
        type: 'project',
        data: { projectId: 'project-1', status: 'completed' },
      };

      await controller.notifyDashboardUpdate(
        body,
        mockOrganizationId,
        mockUserId
      );

      expect(dashboardGateway.broadcastDashboardUpdate).toHaveBeenCalledWith({
        type: 'project',
        data: { ...body.data, userId: mockUserId },
        timestamp: expect.any(Date),
        organizationId: mockOrganizationId,
      });
    });

    it('should handle broadcast errors gracefully', async () => {
      const body = { type: 'stats', data: { action: 'refresh' } };
      mockDashboardGateway.broadcastDashboardUpdate.mockRejectedValue(
        new Error('WebSocket connection failed')
      );

      await expect(
        controller.notifyDashboardUpdate(body, mockOrganizationId, mockUserId)
      ).rejects.toThrow(
        'Failed to send notification: WebSocket connection failed'
      );
    });
  });

  describe('POST /dashboard/refresh-cache', () => {
    it('should refresh cache and notify clients', async () => {
      await controller.refreshDashboardCache(mockOrganizationId);

      expect(cacheManager.del).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}`
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `dashboard-activity-${mockOrganizationId}`
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `dashboard-projects-${mockOrganizationId}`
      );

      expect(dashboardGateway.broadcastDashboardUpdate).toHaveBeenCalledWith({
        type: 'stats',
        data: { action: 'refresh' },
        timestamp: expect.any(Date),
        organizationId: mockOrganizationId,
      });
    });
  });

  describe('GET /dashboard/analytics/trends', () => {
    it('should return analytics trends for specified period', async () => {
      const mockProjects = [
        {
          id: 'p1',
          status: 'completed',
          createdAt: new Date('2023-12-01'),
          startAt: new Date('2023-12-01'),
          dueAt: new Date('2023-12-15'),
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await controller.getAnalyticsTrends(mockOrganizationId, {
        period: '30d',
        metrics: 'projects,tickets',
      });

      expect(result).toHaveProperty('period', '30d');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('trends');
      expect(result.trends).toHaveProperty('projects');
      expect(result.trends).toHaveProperty('tickets');
    });

    it('should use default metrics when not specified', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      await controller.getAnalyticsTrends(mockOrganizationId, {});

      expect(mockPrismaService.project.findMany).toHaveBeenCalled();
      expect(mockPrismaService.ticket.findMany).toHaveBeenCalled();
      expect(mockPrismaService.milestone.findMany).toHaveBeenCalled();
      expect(mockPrismaService.invoice.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /dashboard/analytics/performance', () => {
    it('should return performance metrics', async () => {
      const mockProjects = [
        {
          id: 'p1',
          createdAt: new Date('2023-12-01'),
          milestones: [
            {
              status: 'completed',
              dueAt: new Date('2023-12-10'),
              updatedAt: new Date('2023-12-08'),
            },
          ],
          tickets: [
            {
              status: 'closed',
              priority: 'high',
              createdAt: new Date('2023-12-02'),
              updatedAt: new Date('2023-12-05'),
            },
          ],
          _count: { milestones: 1, tickets: 1 },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await controller.getPerformanceMetrics(
        mockOrganizationId,
        {
          period: '90d',
        }
      );

      expect(result).toHaveProperty('period', '90d');
      expect(result).toHaveProperty('projectPerformance');
      expect(result).toHaveProperty('ticketResolution');
      expect(result).toHaveProperty('milestoneCompletion');
      expect(result).toHaveProperty('invoiceMetrics');
      expect(result.projectPerformance.totalProjects).toBe(1);
    });
  });

  describe('GET /dashboard/analytics/forecast', () => {
    it('should return forecast analytics', async () => {
      const mockActiveProjects = [
        {
          id: 'p1',
          status: 'active',
          dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          milestones: [
            {
              status: 'in-progress',
              dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          ],
          tickets: [{ status: 'open' }],
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockActiveProjects);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await controller.getForecastAnalytics(mockOrganizationId, {
        horizon: '30d',
      });

      expect(result).toHaveProperty('horizon', '30d');
      expect(result).toHaveProperty('forecastDate');
      expect(result).toHaveProperty('projectForecast');
      expect(result).toHaveProperty('milestoneForecast');
      expect(result).toHaveProperty('invoiceForecast');
      expect(result).toHaveProperty('resourceForecast');
    });
  });

  describe('GET /dashboard/analytics/predictive', () => {
    it('should return predictive analytics', async () => {
      const mockHistoricalProjects = [
        {
          id: 'p1',
          status: 'completed',
          createdAt: new Date('2023-10-01'),
          startAt: new Date('2023-10-01'),
          dueAt: new Date('2023-10-30'),
          updatedAt: new Date('2023-10-28'),
        },
      ];

      const mockActiveProjects = [
        {
          id: 'p2',
          name: 'Active Project',
          status: 'active',
          milestones: [
            {
              status: 'completed',
              dueAt: new Date('2023-12-01'),
              updatedAt: new Date('2023-11-30'),
            },
            { status: 'in-progress', dueAt: new Date('2023-12-15') },
          ],
          tickets: [
            { status: 'open', priority: 'high' },
            { status: 'closed', priority: 'low' },
          ],
        },
      ];

      mockPrismaService.project.findMany
        .mockResolvedValueOnce(mockHistoricalProjects) // Historical data
        .mockResolvedValueOnce(mockActiveProjects); // Active projects

      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.milestone.count.mockResolvedValue(0);

      const result = await controller.getPredictiveAnalytics(
        mockOrganizationId,
        {
          horizon: '90d',
          confidence: '0.8',
        }
      );

      expect(result).toHaveProperty('horizon', '90d');
      expect(result).toHaveProperty('confidenceLevel', 0.8);
      expect(result).toHaveProperty('predictions');
      expect(result.predictions).toHaveProperty('projects');
      expect(result.predictions).toHaveProperty('revenue');
      expect(result.predictions).toHaveProperty('risks');
      expect(result.predictions).toHaveProperty('capacity');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrismaService.project.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        controller.getDashboardStats(mockOrganizationId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle cache service errors gracefully', async () => {
      mockCacheManager.get.mockRejectedValue(
        new Error('Cache service unavailable')
      );
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);

      const result = await controller.getDashboardStats(mockOrganizationId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('projects');
    });

    it('should handle invalid time range parameters', async () => {
      mockPrismaService.project.findMany.mockRejectedValue(
        new Error('Invalid time range')
      );

      await expect(
        controller.getAnalyticsTrends(mockOrganizationId, { period: 'invalid' })
      ).rejects.toThrow('Invalid time range');
    });
  });

  describe('Data Validation and Security', () => {
    it('should validate organization access for all endpoints', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);

      await controller.getDashboardStats(mockOrganizationId);
      await controller.getRecentActivity(mockOrganizationId, {});
      await controller.getProjectsOverview(mockOrganizationId);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed input parameters', async () => {
      await expect(
        controller.getRecentActivity(mockOrganizationId, { limit: '-1' })
      ).resolves.toBeDefined(); // Should handle negative limits

      await expect(
        controller.getAnalyticsTrends(mockOrganizationId, { period: 'abc' })
      ).rejects.toThrow(); // Should throw on invalid period
    });
  });
});
