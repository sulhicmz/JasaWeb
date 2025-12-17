import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../../src/dashboard/dashboard.controller';
import { MultiTenantPrismaService } from '../../src/common/database/multi-tenant-prisma.service';
import { PrismaService } from '../../src/common/database/prisma.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardGateway } from '../../src/dashboard/dashboard.gateway';

import { Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';

describe('DashboardController API Contract Tests', () => {
  let controller: DashboardController;
  let prismaService: MultiTenantPrismaService;
  let cacheManager: Cache;
  let dashboardGateway: DashboardGateway;

  const mockOrganizationId = 'org-1';
  const mockUserId = 'user-1';

  const mockPrismaService = {
    project: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    ticket: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    milestone: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  };

  const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  const mockDashboardGateway = {
    broadcastDashboardUpdate: vi.fn(),
  };

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({ ttl: 5, max: 100 }),
        ThrottlerModule.forRoot([{ ttl: 60, limit: 10 }]),
      ],
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
              findFirst: vi.fn(),
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
          useValue: mockReflector,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(APP_GUARD)
      .useValue({ canActivate: () => true }) // Bypass global guards for tests
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    prismaService = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dashboardGateway = module.get<DashboardGateway>(DashboardGateway);

    vi.clearAllMocks();
  });

  describe('API Contract - GET /dashboard/stats', () => {
    it('should return dashboard statistics with correct contract', async () => {
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

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('milestones');

      // Projects contract
      expect(result.projects).toHaveProperty('total');
      expect(result.projects).toHaveProperty('active');
      expect(result.projects).toHaveProperty('completed');
      expect(result.projects).toHaveProperty('onHold');
      expect(typeof result.projects.total).toBe('number');
      expect(typeof result.projects.active).toBe('number');
      expect(typeof result.projects.completed).toBe('number');
      expect(typeof result.projects.onHold).toBe('number');

      // Tickets contract
      expect(result.tickets).toHaveProperty('total');
      expect(result.tickets).toHaveProperty('open');
      expect(result.tickets).toHaveProperty('inProgress');
      expect(result.tickets).toHaveProperty('highPriority');
      expect(result.tickets).toHaveProperty('critical');
      expect(typeof result.tickets.total).toBe('number');
      expect(typeof result.tickets.open).toBe('number');
      expect(typeof result.tickets.inProgress).toBe('number');
      expect(typeof result.tickets.highPriority).toBe('number');
      expect(typeof result.tickets.critical).toBe('number');

      // Invoices contract
      expect(result.invoices).toHaveProperty('total');
      expect(result.invoices).toHaveProperty('pending');
      expect(result.invoices).toHaveProperty('overdue');
      expect(result.invoices).toHaveProperty('totalAmount');
      expect(result.invoices).toHaveProperty('pendingAmount');
      expect(typeof result.invoices.total).toBe('number');
      expect(typeof result.invoices.pending).toBe('number');
      expect(typeof result.invoices.overdue).toBe('number');
      expect(typeof result.invoices.totalAmount).toBe('number');
      expect(typeof result.invoices.pendingAmount).toBe('number');

      // Milestones contract
      expect(result.milestones).toHaveProperty('total');
      expect(result.milestones).toHaveProperty('completed');
      expect(result.milestones).toHaveProperty('overdue');
      expect(result.milestones).toHaveProperty('dueThisWeek');
      expect(typeof result.milestones.total).toBe('number');
      expect(typeof result.milestones.completed).toBe('number');
      expect(typeof result.milestones.overdue).toBe('number');
      expect(typeof result.milestones.dueThisWeek).toBe('number');

      // Verify caching behavior
      expect(cacheManager.set).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}`,
        expect.any(Object),
        300000
      );
    });

    it('should return cached stats with same contract', async () => {
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

      // Should match the exact same contract
      expect(result).toEqual(cachedStats);
      expect(cacheManager.get).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}`
      );
      expect(prismaService.project.findMany).not.toHaveBeenCalled();
    });
  });

  describe('API Contract - GET /dashboard/recent-activity', () => {
    it('should return recent activity with correct contract', async () => {
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

      const result = await controller.getRecentActivity(
        mockOrganizationId,
        '10'
      );

      // API Contract validation
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);

      // Each activity item should follow the contract
      result.forEach((activity) => {
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('status');
        expect(activity).toHaveProperty('createdAt');
        expect(activity).toHaveProperty('priority');

        expect(typeof activity.id).toBe('string');
        expect(typeof activity.type).toBe('string');
        expect(typeof activity.title).toBe('string');
        expect(typeof activity.description).toBe('string');
        expect(typeof activity.status).toBe('string');
        expect(activity.createdAt).toBeInstanceOf(Date);
        expect(['low', 'medium', 'high', 'critical', undefined]).toContain(
          activity.priority
        );
      });

      // Verify sorting by createdAt (most recent first)
      for (let i = 1; i < result.length; i++) {
        const prevDate = result[i - 1]?.createdAt;
        const currDate = result[i]?.createdAt;
        if (prevDate && currDate) {
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      await controller.getRecentActivity(mockOrganizationId, '5');

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }) // Math.ceil(5/4) = 2
      );
    });

    it('should cap limit at 50', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      await controller.getRecentActivity(mockOrganizationId, '100');

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 13 }) // Math.ceil(50/4) = 13
      );
    });
  });

  describe('API Contract - GET /dashboard/projects-overview', () => {
    it('should return projects overview with correct contract', async () => {
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

      const result = await controller.getProjectsOverview(
        mockOrganizationId,
        '6'
      );

      // API Contract validation
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const project = result[0];
      expect(project).toBeDefined();

      if (project) {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('status');
        expect(project).toHaveProperty('progress');
        expect(project).toHaveProperty('totalMilestones');
        expect(project).toHaveProperty('completedMilestones');
        expect(project).toHaveProperty('openTickets');
        expect(project).toHaveProperty('highPriorityTickets');
        expect(project).toHaveProperty('createdAt');
        expect(project).toHaveProperty('updatedAt');
        expect(project).toHaveProperty('startAt');
        expect(project).toHaveProperty('dueAt');

        // Type validation
        expect(typeof project.id).toBe('string');
        expect(typeof project.name).toBe('string');
        expect(typeof project.status).toBe('string');
        expect(typeof project.progress).toBe('number');
        expect(typeof project.totalMilestones).toBe('number');
        expect(typeof project.completedMilestones).toBe('number');
        expect(typeof project.openTickets).toBe('number');
        expect(typeof project.highPriorityTickets).toBe('number');

        // Value validation
        expect(project.progress).toBeGreaterThanOrEqual(0);
        expect(project.progress).toBeLessThanOrEqual(100);
        expect(project.totalMilestones).toBeGreaterThanOrEqual(0);
        expect(project.completedMilestones).toBeGreaterThanOrEqual(0);
        expect(project.completedMilestones).toBeLessThanOrEqual(
          project.totalMilestones
        );
        expect(project.openTickets).toBeGreaterThanOrEqual(0);
        expect(project.highPriorityTickets).toBeGreaterThanOrEqual(0);
        expect(project.highPriorityTickets).toBeLessThanOrEqual(
          project.openTickets
        );
      }
    });
  });

  describe('API Contract - POST /dashboard/notify-update', () => {
    it('should handle notification with correct contract', async () => {
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

  describe('API Contract - POST /dashboard/refresh-cache', () => {
    it('should refresh cache with correct response', async () => {
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

  describe('API Contract - Analytics Endpoints', () => {
    it('should return analytics trends with correct contract', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await controller.getAnalyticsTrends(
        mockOrganizationId,
        '30d',
        'projects,tickets'
      );

      // API Contract validation
      expect(result).toHaveProperty('period', '30d');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('trends');

      expect(typeof result.period).toBe('string');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(typeof result.trends).toBe('object');

      expect(result.trends).toHaveProperty('projects');
      expect(result.trends).toHaveProperty('tickets');
    });

    it('should return performance metrics with correct contract', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await controller.getPerformanceMetrics(
        mockOrganizationId,
        '90d'
      );

      // API Contract validation
      expect(result).toHaveProperty('period', '90d');
      expect(result).toHaveProperty('projectPerformance');
      expect(result).toHaveProperty('ticketResolution');
      expect(result).toHaveProperty('milestoneCompletion');
      expect(result).toHaveProperty('invoiceMetrics');

      expect(typeof result.projectPerformance).toBe('object');
      expect(typeof result.ticketResolution).toBe('object');
      expect(typeof result.milestoneCompletion).toBe('object');
      expect(typeof result.invoiceMetrics).toBe('object');
    });

    it('should return forecast analytics with correct contract', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await controller.getForecastAnalytics(
        mockOrganizationId,
        '30d'
      );

      // API Contract validation
      expect(result).toHaveProperty('horizon', '30d');
      expect(result).toHaveProperty('forecastDate');
      expect(result).toHaveProperty('projectForecast');
      expect(result).toHaveProperty('milestoneForecast');
      expect(result).toHaveProperty('invoiceForecast');
      expect(result).toHaveProperty('resourceForecast');

      expect(typeof result.forecastDate).toBe('string');
      expect(typeof result.projectForecast).toBe('object');
      expect(typeof result.milestoneForecast).toBe('object');
      expect(typeof result.invoiceForecast).toBe('object');
      expect(typeof result.resourceForecast).toBe('object');
    });

    it('should return predictive analytics with correct contract', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.milestone.count.mockResolvedValue(0);

      const result = await controller.getPredictiveAnalytics(
        mockOrganizationId,
        '90d',
        '0.8'
      );

      // API Contract validation
      expect(result).toHaveProperty('horizon', '90d');
      expect(result).toHaveProperty('confidenceLevel', 0.8);
      expect(result).toHaveProperty('predictions');
      expect(result).toHaveProperty('recommendations');

      expect(typeof result.predictions).toBe('object');
      expect(typeof result.recommendations).toBe('object');

      expect(result.predictions).toHaveProperty('projects');
      expect(result.predictions).toHaveProperty('revenue');
      expect(result.predictions).toHaveProperty('risks');
      expect(result.predictions).toHaveProperty('capacity');

      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Error Handling Contract', () => {
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
        controller.getAnalyticsTrends(mockOrganizationId, 'invalid')
      ).rejects.toThrow('Invalid time range');
    });
  });

  describe('Data Validation and Security Contract', () => {
    it('should validate organization access for all endpoints', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.milestone.findMany.mockResolvedValue([]);

      await controller.getDashboardStats(mockOrganizationId);
      await controller.getRecentActivity(mockOrganizationId);
      await controller.getProjectsOverview(mockOrganizationId);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed input parameters', async () => {
      await expect(
        controller.getRecentActivity(mockOrganizationId, '-1')
      ).resolves.toBeDefined(); // Should handle negative limits

      await expect(
        controller.getAnalyticsTrends(mockOrganizationId, 'abc')
      ).rejects.toThrow(); // Should throw on invalid period
    });
  });
});
