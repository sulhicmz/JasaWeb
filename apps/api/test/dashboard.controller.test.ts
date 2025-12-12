import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { MultiTenantPrismaService } from '../src/common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';
import { DashboardGateway } from '../src/dashboard/dashboard.gateway';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockPrismaService: Partial<MultiTenantPrismaService>;
  let mockCacheManager: Partial<Cache>;
  let mockDashboardGateway: Partial<DashboardGateway>;

  beforeEach(async () => {
    mockPrismaService = {
      project: {
        findMany: vi.fn(),
      },
      ticket: {
        findMany: vi.fn(),
      },
      invoice: {
        findMany: vi.fn(),
      },
      milestone: {
        findMany: vi.fn(),
      },
    };

    mockCacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    mockDashboardGateway = {
      broadcastDashboardUpdate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: DashboardGateway,
          useValue: mockDashboardGateway,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    vi.clearAllMocks();
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

      mockCacheManager.get!.mockResolvedValue(cachedStats);

      const result = await controller.getDashboardStats('org-123');

      expect(result).toEqual(cachedStats);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'dashboard-stats-org-123'
      );
    });

    it('should fetch fresh stats and cache them', async () => {
      const projectsData = [
        { status: 'active' },
        { status: 'completed' },
        { status: 'active' },
      ];
      const ticketsData = [
        { status: 'open', priority: 'high' },
        { status: 'in-progress', priority: 'medium' },
      ];
      const invoicesData = [
        { status: 'issued', amount: 5000, dueAt: new Date('2023-12-31') },
        { status: 'draft', amount: 3000, dueAt: new Date('2024-01-15') },
      ];
      const milestonesData = [
        { status: 'completed', dueAt: new Date('2023-12-01') },
        { status: 'in-progress', dueAt: new Date('2024-01-01') },
      ];

      mockCacheManager.get!.mockResolvedValue(null);
      mockPrismaService.project!.findMany!.mockResolvedValue(projectsData);
      mockPrismaService.ticket!.findMany!.mockResolvedValue(ticketsData);
      mockPrismaService.invoice!.findMany!.mockResolvedValue(invoicesData);
      mockPrismaService.milestone!.findMany!.mockResolvedValue(milestonesData);

      const result = await controller.getDashboardStats('org-123');

      expect(result.projects).toEqual({
        total: 3,
        active: 2,
        completed: 1,
        onHold: 0,
      });
      expect(result.tickets).toEqual({
        total: 2,
        open: 1,
        inProgress: 1,
        highPriority: 1,
        critical: 0,
      });
      expect(result.invoices).toEqual({
        total: 2,
        pending: 2,
        overdue: 1,
        totalAmount: 8000,
        pendingAmount: 8000,
      });
      expect(result.milestones).toEqual({
        total: 2,
        completed: 1,
        overdue: 0,
        dueThisWeek: expect.any(Number),
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard-stats-org-123',
        expect.any(Object),
        300000
      );
    });

    it('should force refresh when refresh parameter is true', async () => {
      mockCacheManager.get!.mockResolvedValue({ some: 'cached_data' });
      mockPrismaService.project!.findMany!.mockResolvedValue([]);
      mockPrismaService.ticket!.findMany!.mockResolvedValue([]);
      mockPrismaService.invoice!.findMany!.mockResolvedValue([]);
      mockPrismaService.milestone!.findMany!.mockResolvedValue([]);

      await controller.getDashboardStats('org-123', 'true');

      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(mockPrismaService.project!.findMany).toHaveBeenCalled();
    });
  });

  describe('getRecentActivity', () => {
    it('should return combined recent activities', async () => {
      const projectsData = [
        {
          id: 'p1',
          name: 'Project 1',
          status: 'active',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
      ];
      const ticketsData = [
        {
          id: 't1',
          type: 'bug',
          priority: 'high',
          status: 'open',
          createdAt: new Date('2023-01-03'),
        },
      ];
      const milestonesData = [
        {
          id: 'm1',
          title: 'Milestone 1',
          status: 'completed',
          dueAt: new Date('2023-01-04'),
          createdAt: new Date('2023-01-01'),
        },
      ];
      const invoicesData = [
        {
          id: 'i1',
          status: 'issued',
          amount: 1000,
          dueAt: new Date('2023-01-05'),
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockPrismaService.project!.findMany!.mockResolvedValue(projectsData);
      mockPrismaService.ticket!.findMany!.mockResolvedValue(ticketsData);
      mockPrismaService.milestone!.findMany!.mockResolvedValue(milestonesData);
      mockPrismaService.invoice!.findMany!.mockResolvedValue(invoicesData);

      const result = await controller.getRecentActivity('org-123', '5');

      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('ticket'); // Most recent (2023-01-03)
      expect(result[1].type).toBe('invoice'); // 2023-01-02 (updated)
      expect(result[2].type).toBe('project'); // 2023-01-02 (updated)
      expect(result[3].type).toBe('milestone'); // 2023-01-01
    });

    it('should limit results to specified number', async () => {
      mockPrismaService.project!.findMany!.mockResolvedValue([]);
      mockPrismaService.ticket!.findMany!.mockResolvedValue([]);
      mockPrismaService.milestone!.findMany!.mockResolvedValue([]);
      mockPrismaService.invoice!.findMany!.mockResolvedValue([]);

      const result = await controller.getRecentActivity('org-123', '2');

      // Should cap at 2 items
      expect(mockPrismaService.project!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 }) // Math.ceil(2/4) = 1
      );
    });
  });

  describe('getProjectsOverview', () => {
    it('should return projects with calculated metrics', async () => {
      const projectsData = [
        {
          id: 'p1',
          name: 'Project 1',
          status: 'active',
          startAt: new Date('2023-01-01'),
          dueAt: new Date('2023-12-31'),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          milestones: [
            { id: 'm1', status: 'completed', dueAt: new Date('2023-06-01') },
            { id: 'm2', status: 'in-progress', dueAt: new Date('2023-12-01') },
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

      mockPrismaService.project!.findMany!.mockResolvedValue(projectsData);

      const result = await controller.getProjectsOverview('org-123', '5');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'p1',
        name: 'Project 1',
        description: null,
        status: 'active',
        progress: 50, // 1 completed out of 2 milestones
        totalMilestones: 2,
        completedMilestones: 1,
        openTickets: 1,
        highPriorityTickets: 1,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        startAt: expect.any(Date),
        dueAt: expect.any(Date),
      });
    });
  });

  describe('notifyDashboardUpdate', () => {
    it('should broadcast update via WebSocket gateway', async () => {
      const body = { type: 'project', data: { name: 'New Project' } };

      await controller.notifyDashboardUpdate(body, 'org-123', 'user-123');

      expect(
        mockDashboardGateway.broadcastDashboardUpdate
      ).toHaveBeenCalledWith({
        type: 'project',
        data: { name: 'New Project', userId: 'user-123' },
        timestamp: expect.any(Date),
        organizationId: 'org-123',
      });
    });
  });

  describe('refreshDashboardCache', () => {
    it('should clear cache and broadcast refresh event', async () => {
      await controller.refreshDashboardCache('org-123');

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'dashboard-stats-org-123'
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'dashboard-activity-org-123'
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'dashboard-projects-org-123'
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('analytics-org-123');
      expect(mockCacheManager.del).toHaveBeenCalledWith('insights-org-123');
      expect(
        mockDashboardGateway.broadcastDashboardUpdate
      ).toHaveBeenCalledWith({
        type: 'stats',
        data: { action: 'refresh' },
        timestamp: expect.any(Date),
        organizationId: 'org-123',
      });
    });
  });

  describe('getAdvancedAnalytics', () => {
    it('should return cached analytics when available', async () => {
      const cachedAnalytics = {
        timeRange: 30,
        projectTrends: {
          weeklyTrends: {
            '2025-W50': { created: 3, completed: 2, started: 2 },
          },
          totalCreated: 5,
          averageCompletionTime: 15.5,
          onTimeDeliveryRate: 85.5,
        },
        ticketMetrics: {
          totalTickets: 25,
          openTickets: 8,
          resolvedTickets: 15,
          averageResolutionTime: 172800000,
          ticketsByPriority: { low: 5, medium: 10, high: 7, critical: 3 },
          ticketsByType: { bug: 10, feature: 8, support: 7 },
          resolutionRate: 75.0,
        },
        invoiceAnalytics: {
          totalInvoices: 15,
          totalAmount: 50000,
          paidAmount: 35000,
          outstandingAmount: 15000,
          averageInvoiceValue: 3333.33,
          paymentRate: 70.0,
          monthlyRevenue: { '2025-11': 15000, '2025-12': 20000 },
        },
        milestoneAnalytics: {
          totalMilestones: 30,
          completedMilestones: 20,
          overdueMilestones: 3,
          averageCompletionTime: 864000000,
          onTimeCompletionRate: 80.0,
        },
        teamPerformance: [
          {
            userId: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            ticketsAssigned: 10,
            ticketsResolved: 8,
            ticketResolutionRate: 80.0,
            averageResolutionTime: 129600000,
            projectsCreated: 2,
            projectsCompleted: 1,
          },
        ],
        riskIndicators: {
          riskScore: 35,
          riskLevel: 'medium',
          overdueProjects: 1,
          highPriorityTickets: 3,
          overdueInvoices: 2,
          recommendations: [
            'Review project timelines',
            'Follow up on payments',
          ],
        },
        generatedAt: new Date().toISOString(),
      };

      mockCacheManager.get!.mockResolvedValue(cachedAnalytics);

      const result = await controller.getAdvancedAnalytics('org-123');

      expect(result).toEqual(cachedAnalytics);
      expect(mockCacheManager.get).toHaveBeenCalledWith('analytics-org-123-30');
    });

    it('should generate fresh analytics when cache is empty', async () => {
      mockCacheManager.get!.mockResolvedValue(null);

      // Mock project data
      mockPrismaService.project!.findMany!.mockResolvedValue([
        {
          createdAt: new Date(),
          status: 'active',
          startAt: new Date(),
          dueAt: new Date(),
          milestones: [
            { status: 'completed', dueAt: new Date(), completedAt: new Date() },
          ],
        },
      ]);

      // Mock ticket data
      mockPrismaService.ticket!.findMany!.mockResolvedValue([
        {
          createdAt: new Date(),
          status: 'resolved',
          priority: 'high',
          type: 'bug',
          resolvedAt: new Date(),
        },
      ]);

      // Mock invoice data
      mockPrismaService.invoice!.findMany!.mockResolvedValue([
        {
          createdAt: new Date(),
          amount: 1000,
          status: 'paid',
          dueAt: new Date(),
          paidAt: new Date(),
        },
      ]);

      // Mock milestone data
      mockPrismaService.milestone!.findMany!.mockResolvedValue([
        {
          createdAt: new Date(),
          status: 'completed',
          dueAt: new Date(),
          completedAt: new Date(),
          projectId: 'project1',
        },
      ]);

      // Mock user data
      mockPrismaService.user!.findMany!.mockResolvedValue([
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          assignedTickets: [
            {
              status: 'resolved',
              resolvedAt: new Date(),
              createdAt: new Date(),
            },
          ],
          createdProjects: [{ status: 'completed', createdAt: new Date() }],
        },
      ]);

      const result = await controller.getAdvancedAnalytics('org-123');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'analytics-org-123-30',
        expect.any(Object),
        600000
      );
      expect(result).toHaveProperty('timeRange');
      expect(result).toHaveProperty('projectTrends');
      expect(result).toHaveProperty('ticketMetrics');
      expect(result).toHaveProperty('invoiceAnalytics');
      expect(result).toHaveProperty('milestoneAnalytics');
      expect(result).toHaveProperty('teamPerformance');
      expect(result).toHaveProperty('riskIndicators');
    });

    it('should handle different time ranges', async () => {
      mockCacheManager.get!.mockResolvedValue(null);
      mockPrismaService.project!.findMany!.mockResolvedValue([]);

      await controller.getAdvancedAnalytics('org-123', '90');

      expect(mockCacheManager.get).toHaveBeenCalledWith('analytics-org-123-90');
      expect(mockPrismaService.project!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('getIntelligentInsights', () => {
    it('should return cached insights when available', async () => {
      const cachedInsights = {
        projectPredictions: [
          {
            projectId: 'project1',
            projectName: 'Test Project',
            currentProgress: 65,
            expectedProgress: 70,
            velocity: 0.85,
            predictedCompletionDate: new Date('2025-12-20').toISOString(),
            isOnTrack: false,
            riskLevel: 'medium',
          },
        ],
        productivityInsights: {
          ticketVolumeGrowth: 15.5,
          projectVolumeGrowth: 8.2,
          productivityTrend: 'increasing',
          teamCapacity: 'optimal',
        },
        financialInsights: {
          quarterlyRevenue: 50000,
          quarterlyPaidRevenue: 35000,
          monthlyAverageRevenue: 16666.67,
          outstandingAmount: 15000,
          revenueGrowthRate: 12.5,
          paymentEfficiency: 70.0,
        },
        recommendations: [
          {
            type: 'project',
            priority: 'high',
            title: 'Address Overdue Projects',
            description:
              'You have 1 overdue project(s). Consider reviewing timelines and reallocating resources.',
            action: 'Review project timelines',
          },
        ],
        alerts: [
          {
            type: 'deadline',
            severity: 'warning',
            title: 'Project Deadline Approaching',
            message: 'Project "Test Project" is due on 12/20/2025',
            entityId: 'project1',
            entityType: 'project',
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      mockCacheManager.get!.mockResolvedValue(cachedInsights);

      const result = await controller.getIntelligentInsights('org-123');

      expect(result).toEqual(cachedInsights);
      expect(mockCacheManager.get).toHaveBeenCalledWith('insights-org-123');
    });

    it('should generate fresh insights when cache is empty', async () => {
      mockCacheManager.get!.mockResolvedValue(null);

      // Mock project data for predictions
      mockPrismaService.project!.findMany!.mockResolvedValue([
        {
          id: 'project1',
          name: 'Test Project',
          status: 'active',
          startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          dueAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          milestones: [
            { status: 'completed', dueAt: new Date(), completedAt: new Date() },
            { status: 'in-progress', dueAt: new Date() },
          ],
        },
      ]);

      // Mock counts for recommendations
      mockPrismaService.project!.count!.mockResolvedValue(2);
      mockPrismaService.ticket!.count!.mockResolvedValue(5);
      mockPrismaService.invoice!.count!.mockResolvedValue(3);

      // Mock invoice data for financial insights
      mockPrismaService.invoice!.findMany!.mockResolvedValue([
        {
          createdAt: new Date(),
          amount: 1000,
          status: 'paid',
          dueAt: new Date(),
        },
      ]);

      const result = await controller.getIntelligentInsights('org-123');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'insights-org-123',
        expect.any(Object),
        900000
      );
      expect(result).toHaveProperty('projectPredictions');
      expect(result).toHaveProperty('productivityInsights');
      expect(result).toHaveProperty('financialInsights');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('alerts');
    });

    it('should generate project predictions with correct risk levels', async () => {
      mockCacheManager.get!.mockResolvedValue(null);

      const mockProject = {
        id: 'project1',
        name: 'Test Project',
        status: 'active',
        startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dueAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        milestones: [
          { status: 'completed', dueAt: new Date(), completedAt: new Date() },
          { status: 'completed', dueAt: new Date(), completedAt: new Date() },
          { status: 'in-progress', dueAt: new Date() },
        ],
      };

      mockPrismaService.project!.findMany!.mockResolvedValue([mockProject]);
      mockPrismaService.project!.count!.mockResolvedValue(0);
      mockPrismaService.ticket!.count!.mockResolvedValue(0);
      mockPrismaService.invoice!.findMany!.mockResolvedValue([]);

      const result = await controller.getIntelligentInsights('org-123');

      const predictions = result.projectPredictions;
      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toHaveProperty('currentProgress');
      expect(predictions[0]).toHaveProperty('expectedProgress');
      expect(predictions[0]).toHaveProperty('velocity');
      expect(predictions[0]).toHaveProperty('predictedCompletionDate');
      expect(predictions[0]).toHaveProperty('isOnTrack');
      expect(predictions[0]).toHaveProperty('riskLevel');
      expect(['low', 'medium', 'high']).toContain(predictions[0].riskLevel);
    });

    it('should generate recommendations based on actual data', async () => {
      mockCacheManager.get!.mockResolvedValue(null);

      mockPrismaService.project!.findMany!.mockResolvedValue([]);
      mockPrismaService.project!.count!.mockResolvedValue(2);
      mockPrismaService.ticket!.count!.mockResolvedValue(5);
      mockPrismaService.invoice!.count!.mockResolvedValue(3);
      mockPrismaService.invoice!.findMany!.mockResolvedValue([]);

      const result = await controller.getIntelligentInsights('org-123');

      const recommendations = result.recommendations;
      expect(recommendations.length).toBeGreaterThan(0);

      const hasProjectRecommendation = recommendations.some(
        (r) => r.type === 'project'
      );
      const hasTicketRecommendation = recommendations.some(
        (r) => r.type === 'ticket'
      );
      const hasFinancialRecommendation = recommendations.some(
        (r) => r.type === 'financial'
      );

      expect(hasProjectRecommendation).toBe(true);
      expect(hasTicketRecommendation).toBe(true);
      expect(hasFinancialRecommendation).toBe(true);
    });

    it('should generate alerts for upcoming deadlines and overdue milestones', async () => {
      mockCacheManager.get!.mockResolvedValue(null);

      mockPrismaService.project!.findMany!.mockResolvedValue([
        {
          id: 'project1',
          name: 'Urgent Project',
          status: 'active',
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      ]);

      mockPrismaService.milestone!.findMany!.mockResolvedValue([
        {
          id: 'milestone1',
          title: 'Overdue Milestone',
          status: 'in-progress',
          dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          projectId: 'project1',
        },
      ]);

      mockPrismaService.project!.count!.mockResolvedValue(0);
      mockPrismaService.ticket!.count!.mockResolvedValue(0);
      mockPrismaService.invoice!.findMany!.mockResolvedValue([]);

      const result = await controller.getIntelligentInsights('org-123');

      const alerts = result.alerts;
      expect(alerts.length).toBeGreaterThan(0);

      const hasDeadlineAlert = alerts.some((a) => a.type === 'deadline');
      const hasMilestoneAlert = alerts.some((a) => a.type === 'milestone');

      expect(hasDeadlineAlert).toBe(true);
      expect(hasMilestoneAlert).toBe(true);
    });
  });
});
