import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardTimeRange } from './dto/dashboard.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;
  let cacheManager: Cache;

  const mockOrganizationId = 'test-org-id';

  const mockDashboardStats = {
    projects: {
      total: 10,
      active: 5,
      completed: 3,
      onHold: 1,
      planning: 1,
      averageProgress: 65,
      overdue: 2,
    },
    tickets: {
      total: 25,
      open: 8,
      inProgress: 5,
      resolved: 12,
      highPriority: 3,
      critical: 1,
      averageResolutionTime: 4.5,
      overdue: 2,
    },
    invoices: {
      total: 15,
      pending: 5,
      overdue: 2,
      paid: 8,
      totalAmount: 50000,
      pendingAmount: 15000,
      overdueAmount: 5000,
      paidAmount: 30000,
    },
    milestones: {
      total: 30,
      completed: 18,
      overdue: 3,
      dueThisWeek: 4,
      dueThisMonth: 8,
      completionRate: 60,
    },
    lastUpdated: new Date(),
    timeRange: DashboardTimeRange.MONTH,
  };

  const mockRecentActivity = [
    {
      id: '1',
      type: 'project' as const,
      title: 'Test Project',
      description: 'Test Description',
      status: 'active',
      createdAt: new Date(),
      projectId: 'proj-1',
      projectName: 'Test Project',
    },
    {
      id: '2',
      type: 'ticket' as const,
      title: 'Bug ticket',
      description: 'Priority: high',
      status: 'open',
      priority: 'high',
      createdAt: new Date(),
      projectId: 'proj-1',
      projectName: 'Test Project',
    },
  ];

  const mockProjectsOverview = [
    {
      id: 'proj-1',
      name: 'Test Project',
      description: 'Test Description',
      status: 'active',
      progress: 75,
      totalMilestones: 4,
      completedMilestones: 3,
      openTickets: 2,
      highPriorityTickets: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      startAt: new Date(),
      dueAt: new Date(),
      nextMilestoneDue: new Date(),
      health: 'good' as const,
    },
  ];

  const mockDashboardKpi = {
    clientSatisfaction: 8.5,
    averageDeliveryTime: 45,
    slaCompliance: 92,
    revenueGrowth: 15.5,
    clientRetentionRate: 92.0,
    projectSuccessRate: 85,
  };

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getDashboardStats: jest.fn().mockResolvedValue(mockDashboardStats),
            getRecentActivity: jest.fn().mockResolvedValue(mockRecentActivity),
            getProjectsOverview: jest
              .fn()
              .mockResolvedValue(mockProjectsOverview),
            getDashboardKpi: jest.fn().mockResolvedValue(mockDashboardKpi),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics with default time range', async () => {
      const query = { timeRange: undefined, refresh: false };

      const result = await controller.getDashboardStats(
        mockOrganizationId,
        query
      );

      expect(service.getDashboardStats).toHaveBeenCalledWith(
        mockOrganizationId,
        DashboardTimeRange.MONTH,
        false
      );
      expect(result).toEqual(mockDashboardStats);
    });

    it('should return dashboard statistics with custom time range', async () => {
      const query = { timeRange: DashboardTimeRange.WEEK, refresh: true };

      const result = await controller.getDashboardStats(
        mockOrganizationId,
        query
      );

      expect(service.getDashboardStats).toHaveBeenCalledWith(
        mockOrganizationId,
        DashboardTimeRange.WEEK,
        true
      );
      expect(result).toEqual(mockDashboardStats);
    });

    it('should handle service errors gracefully', async () => {
      jest
        .spyOn(service, 'getDashboardStats')
        .mockRejectedValue(new Error('Service error'));

      const query = { timeRange: DashboardTimeRange.MONTH, refresh: false };

      await expect(
        controller.getDashboardStats(mockOrganizationId, query)
      ).rejects.toThrow('Service error');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity with default limit', async () => {
      const query = { limit: 10, type: undefined };

      const result = await controller.getRecentActivity(
        mockOrganizationId,
        query
      );

      expect(service.getRecentActivity).toHaveBeenCalledWith(
        mockOrganizationId,
        10,
        undefined
      );
      expect(result).toEqual(mockRecentActivity);
    });

    it('should return recent activity with custom limit and type filter', async () => {
      const query = { limit: 5, type: 'project' };

      const result = await controller.getRecentActivity(
        mockOrganizationId,
        query
      );

      expect(service.getRecentActivity).toHaveBeenCalledWith(
        mockOrganizationId,
        5,
        'project'
      );
      expect(result).toEqual(mockRecentActivity);
    });

    it('should limit maximum number of activities', async () => {
      const query = { limit: 100, type: undefined };

      await controller.getRecentActivity(mockOrganizationId, query);

      expect(service.getRecentActivity).toHaveBeenCalledWith(
        mockOrganizationId,
        50,
        undefined
      );
    });
  });

  describe('getProjectsOverview', () => {
    it('should return projects overview with default parameters', async () => {
      const query = {
        limit: 6,
        status: undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      };

      const result = await controller.getProjectsOverview(
        mockOrganizationId,
        query
      );

      expect(service.getProjectsOverview).toHaveBeenCalledWith(
        mockOrganizationId,
        6,
        undefined,
        'updatedAt',
        'desc'
      );
      expect(result).toEqual(mockProjectsOverview);
    });

    it('should return projects overview with custom parameters', async () => {
      const query = {
        limit: 10,
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = await controller.getProjectsOverview(
        mockOrganizationId,
        query
      );

      expect(service.getProjectsOverview).toHaveBeenCalledWith(
        mockOrganizationId,
        10,
        'active',
        'name',
        'asc'
      );
      expect(result).toEqual(mockProjectsOverview);
    });

    it('should limit maximum number of projects', async () => {
      const query = {
        limit: 50,
        status: undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      };

      await controller.getProjectsOverview(mockOrganizationId, query);

      expect(service.getProjectsOverview).toHaveBeenCalledWith(
        mockOrganizationId,
        20,
        undefined,
        'updatedAt',
        'desc'
      );
    });
  });

  describe('getDashboardKpi', () => {
    it('should return dashboard KPIs', async () => {
      const result = await controller.getDashboardKpi(mockOrganizationId);

      expect(service.getDashboardKpi).toHaveBeenCalledWith(mockOrganizationId);
      expect(result).toEqual(mockDashboardKpi);
    });

    it('should handle KPI service errors gracefully', async () => {
      jest
        .spyOn(service, 'getDashboardKpi')
        .mockRejectedValue(new Error('KPI service error'));

      await expect(
        controller.getDashboardKpi(mockOrganizationId)
      ).rejects.toThrow('KPI service error');
    });
  });
});
