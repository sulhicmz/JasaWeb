import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardTimeRange } from './dto/dashboard.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: MultiTenantPrismaService;
  let cacheManager: Cache;

  const mockOrganizationId = 'test-org-id';

  const mockProjects = [
    {
      id: 'proj-1',
      name: 'Test Project 1',
      status: 'active',
      organizationId: mockOrganizationId,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      startAt: new Date('2024-01-01'),
      dueAt: new Date('2024-03-01'),
      milestones: [
        {
          id: 'milestone-1',
          status: 'completed',
          dueAt: new Date('2024-01-15'),
        },
        {
          id: 'milestone-2',
          status: 'in-progress',
          dueAt: new Date('2024-02-15'),
        },
      ],
      tickets: [
        { id: 'ticket-1', status: 'open', priority: 'high' },
        { id: 'ticket-2', status: 'resolved', priority: 'low' },
      ],
    },
    {
      id: 'proj-2',
      name: 'Test Project 2',
      status: 'completed',
      organizationId: mockOrganizationId,
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-10'),
      startAt: new Date('2023-12-01'),
      dueAt: new Date('2024-01-10'),
      completedAt: new Date('2024-01-10'),
      milestones: [
        {
          id: 'milestone-3',
          status: 'completed',
          dueAt: new Date('2023-12-15'),
        },
        {
          id: 'milestone-4',
          status: 'completed',
          dueAt: new Date('2024-01-05'),
        },
      ],
      tickets: [],
    },
  ];

  const mockTickets = [
    {
      id: 'ticket-1',
      type: 'bug',
      priority: 'high',
      status: 'open',
      organizationId: mockOrganizationId,
      createdAt: new Date('2024-01-10'),
      projectId: 'proj-1',
      project: { name: 'Test Project 1' },
    },
    {
      id: 'ticket-2',
      type: 'feature',
      priority: 'low',
      status: 'resolved',
      organizationId: mockOrganizationId,
      createdAt: new Date('2024-01-05'),
      resolvedAt: new Date('2024-01-08'),
      projectId: 'proj-1',
      project: { name: 'Test Project 1' },
    },
  ];

  const mockInvoices = [
    {
      id: 'invoice-1',
      status: 'issued',
      amount: 5000,
      dueAt: new Date('2024-02-01'),
      organizationId: mockOrganizationId,
      createdAt: new Date('2024-01-01'),
      projectId: 'proj-1',
      project: { name: 'Test Project 1' },
    },
    {
      id: 'invoice-2',
      status: 'paid',
      amount: 3000,
      dueAt: new Date('2024-01-15'),
      paidAt: new Date('2024-01-14'),
      organizationId: mockOrganizationId,
      createdAt: new Date('2023-12-15'),
      projectId: 'proj-2',
      project: { name: 'Test Project 2' },
    },
  ];

  const mockMilestones = [
    {
      id: 'milestone-1',
      title: 'Design Phase',
      status: 'completed',
      dueAt: new Date('2024-01-15'),
      organizationId: mockOrganizationId,
      createdAt: new Date('2024-01-01'),
      projectId: 'proj-1',
      project: { name: 'Test Project 1' },
    },
    {
      id: 'milestone-2',
      title: 'Development Phase',
      status: 'in-progress',
      dueAt: new Date('2024-02-15'),
      organizationId: mockOrganizationId,
      createdAt: new Date('2024-01-10'),
      projectId: 'proj-1',
      project: { name: 'Test Project 1' },
    },
  ];

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const mockPrismaService = {
      project: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      ticket: {
        findMany: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
      milestone: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return cached stats when available', async () => {
      const cachedStats = {
        projects: {
          total: 5,
          active: 3,
          completed: 2,
          onHold: 0,
          planning: 0,
          averageProgress: 60,
          overdue: 1,
        },
        tickets: {
          total: 10,
          open: 3,
          inProgress: 2,
          resolved: 5,
          highPriority: 1,
          critical: 0,
          averageResolutionTime: 4,
          overdue: 1,
        },
        invoices: {
          total: 8,
          pending: 2,
          overdue: 1,
          paid: 5,
          totalAmount: 40000,
          pendingAmount: 10000,
          overdueAmount: 5000,
          paidAmount: 25000,
        },
        milestones: {
          total: 15,
          completed: 10,
          overdue: 2,
          dueThisWeek: 3,
          dueThisMonth: 5,
          completionRate: 67,
        },
        lastUpdated: new Date(),
        timeRange: DashboardTimeRange.MONTH,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedStats);

      const result = await service.getDashboardStats(mockOrganizationId);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}-month`
      );
      expect(result).toEqual(cachedStats);
      expect(prismaService.project.findMany).not.toHaveBeenCalled();
    });

    it('should fetch fresh stats when cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);
      jest
        .spyOn(prismaService.ticket, 'findMany')
        .mockResolvedValue(mockTickets);
      jest
        .spyOn(prismaService.invoice, 'findMany')
        .mockResolvedValue(mockInvoices);
      jest
        .spyOn(prismaService.milestone, 'findMany')
        .mockResolvedValue(mockMilestones);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getDashboardStats(mockOrganizationId);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `dashboard-stats-${mockOrganizationId}-month`
      );
      expect(prismaService.project.findMany).toHaveBeenCalled();
      expect(prismaService.ticket.findMany).toHaveBeenCalled();
      expect(prismaService.invoice.findMany).toHaveBeenCalled();
      expect(prismaService.milestone.findMany).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('milestones');
    });

    it('should force refresh when refresh parameter is true', async () => {
      const cachedStats = {
        /* cached data */
      };
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedStats);
      jest.spyOn(prismaService.project, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.ticket, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.invoice, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.milestone, 'findMany').mockResolvedValue([]);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await service.getDashboardStats(
        mockOrganizationId,
        DashboardTimeRange.WEEK,
        true
      );

      expect(prismaService.project.findMany).toHaveBeenCalled();
    });
  });

  describe('getRecentActivity', () => {
    it('should return combined recent activities', async () => {
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);
      jest
        .spyOn(prismaService.ticket, 'findMany')
        .mockResolvedValue(mockTickets);
      jest
        .spyOn(prismaService.milestone, 'findMany')
        .mockResolvedValue(mockMilestones);
      jest
        .spyOn(prismaService.invoice, 'findMany')
        .mockResolvedValue(mockInvoices);

      const result = await service.getRecentActivity(mockOrganizationId, 10);

      expect(result).toHaveLength(6); // 2 projects + 2 tickets + 2 milestones + 2 invoices, limited to 10
      expect(result[0].type).toBeDefined();
      expect(result[0].title).toBeDefined();
      expect(result[0].createdAt).toBeDefined();
    });

    it('should filter by activity type', async () => {
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);
      jest.spyOn(prismaService.ticket, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.milestone, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.invoice, 'findMany').mockResolvedValue([]);

      const result = await service.getRecentActivity(
        mockOrganizationId,
        10,
        'project'
      );

      expect(result).toHaveLength(2);
      expect(result.every((activity) => activity.type === 'project')).toBe(
        true
      );
      expect(prismaService.ticket.findMany).not.toHaveBeenCalled();
    });

    it('should limit maximum number of activities', async () => {
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);
      jest
        .spyOn(prismaService.ticket, 'findMany')
        .mockResolvedValue(mockTickets);
      jest
        .spyOn(prismaService.milestone, 'findMany')
        .mockResolvedValue(mockMilestones);
      jest
        .spyOn(prismaService.invoice, 'findMany')
        .mockResolvedValue(mockInvoices);

      const result = await service.getRecentActivity(mockOrganizationId, 100);

      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('getProjectsOverview', () => {
    it('should return projects with calculated metrics', async () => {
      const mockProjectsWithRelations = mockProjects.map((project) => ({
        ...project,
        _count: {
          milestones: project.milestones.length,
          tickets: project.tickets.length,
        },
      }));

      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjectsWithRelations);

      const result = await service.getProjectsOverview(mockOrganizationId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('progress');
      expect(result[0]).toHaveProperty('health');
      expect(result[0]).toHaveProperty('totalMilestones');
      expect(result[0]).toHaveProperty('completedMilestones');
      expect(result[0]).toHaveProperty('openTickets');
      expect(result[0]).toHaveProperty('highPriorityTickets');
    });

    it('should filter projects by status', async () => {
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue([mockProjects[0]]);

      const result = await service.getProjectsOverview(
        mockOrganizationId,
        6,
        'active'
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
      expect(prismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrganizationId, status: 'active' },
        })
      );
    });

    it('should sort projects by specified field', async () => {
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);

      await service.getProjectsOverview(
        mockOrganizationId,
        6,
        undefined,
        'name',
        'asc'
      );

      expect(prismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should calculate project health correctly', async () => {
      const overdueProject = {
        ...mockProjects[0],
        dueAt: new Date('2024-01-01'), // Past due date
        milestones: [{ status: 'completed' }, { status: 'in-progress' }],
        tickets: [
          { status: 'open', priority: 'critical' },
          { status: 'open', priority: 'high' },
          { status: 'open', priority: 'high' },
          { status: 'open', priority: 'high' },
          { status: 'open', priority: 'high' },
        ],
        _count: { milestones: 2, tickets: 5 },
      };

      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue([overdueProject]);

      const result = await service.getProjectsOverview(mockOrganizationId);

      expect(result[0].health).toBe('critical');
    });
  });

  describe('getDashboardKpi', () => {
    it('should return cached KPIs when available', async () => {
      const cachedKpi = {
        clientSatisfaction: 8.5,
        averageDeliveryTime: 45,
        slaCompliance: 92,
        revenueGrowth: 15.5,
        clientRetentionRate: 92.0,
        projectSuccessRate: 85,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedKpi);

      const result = await service.getDashboardKpi(mockOrganizationId);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `dashboard-kpi-${mockOrganizationId}`
      );
      expect(result).toEqual(cachedKpi);
    });

    it('should calculate fresh KPIs when cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(10);
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);
      jest
        .spyOn(prismaService.ticket, 'findMany')
        .mockResolvedValue(mockTickets);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getDashboardKpi(mockOrganizationId);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `dashboard-kpi-${mockOrganizationId}`
      );
      expect(result).toHaveProperty('clientSatisfaction');
      expect(result).toHaveProperty('averageDeliveryTime');
      expect(result).toHaveProperty('slaCompliance');
      expect(result).toHaveProperty('revenueGrowth');
      expect(result).toHaveProperty('clientRetentionRate');
      expect(result).toHaveProperty('projectSuccessRate');
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('calculateProjectHealth', () => {
    it('should return critical health for overdue projects', () => {
      const health = (service as any).calculateProjectHealth(
        50, // progress
        2, // open tickets
        1, // high priority tickets
        new Date('2024-01-01') // overdue
      );

      expect(health).toBe('critical');
    });

    it('should return critical health for too many high priority tickets', () => {
      const health = (service as any).calculateProjectHealth(
        50, // progress
        2, // open tickets
        4, // high priority tickets
        new Date('2024-12-31') // future due date
      );

      expect(health).toBe('critical');
    });

    it('should return excellent health for high progress and no issues', () => {
      const health = (service as any).calculateProjectHealth(
        80, // progress
        1, // open tickets
        0, // high priority tickets
        new Date('2024-12-31') // future due date
      );

      expect(health).toBe('excellent');
    });

    it('should return good health for normal conditions', () => {
      const health = (service as any).calculateProjectHealth(
        50, // progress
        2, // open tickets
        1, // high priority tickets
        new Date('2024-12-31') // future due date
      );

      expect(health).toBe('good');
    });
  });

  describe('getDateRange', () => {
    it('should return correct date range for today', () => {
      const dateRange = (service as any).getDateRange(DashboardTimeRange.TODAY);
      const now = new Date();

      expect(dateRange.start).toBeInstanceOf(Date);
      expect(dateRange.end).toBeInstanceOf(Date);
      expect(dateRange.start.getHours()).toBe(0);
      expect(dateRange.start.getMinutes()).toBe(0);
      expect(dateRange.end.getHours()).toBe(23);
      expect(dateRange.end.getMinutes()).toBe(59);
    });

    it('should return correct date range for week', () => {
      const dateRange = (service as any).getDateRange(DashboardTimeRange.WEEK);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(dateRange.start.getTime()).toBeCloseTo(weekAgo.getTime(), -1000); // Within 1 second
      expect(dateRange.end.getTime()).toBeCloseTo(now.getTime(), -1000);
    });

    it('should return correct date range for month', () => {
      const dateRange = (service as any).getDateRange(DashboardTimeRange.MONTH);
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(dateRange.start.getTime()).toBeCloseTo(monthAgo.getTime(), -1000);
      expect(dateRange.end.getTime()).toBeCloseTo(now.getTime(), -1000);
    });
  });
});
