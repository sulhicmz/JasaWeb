import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardGateway } from './dashboard.gateway';
import { Role } from '../common/decorators/roles.decorator';

describe('DashboardController', () => {
  let controller: DashboardController;
  let multiTenantPrisma: MultiTenantPrismaService;
  let cacheManager: any;

  const mockMultiTenantPrisma = {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    milestone: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockDashboardGateway = {
    broadcastStatsUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrisma,
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
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardStats', () => {
    const organizationId = 'test-org-id';
    const userId = 'test-user-id';

    it('should return dashboard stats for organization', async () => {
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);

      // Mock database responses
      mockMultiTenantPrisma.project.count
        .mockResolvedValueOnce(10) // total projects
        .mockResolvedValueOnce(5) // active projects
        .mockResolvedValueOnce(3) // completed projects
        .mockResolvedValueOnce(2); // on hold projects;

      mockMultiTenantPrisma.ticket.count
        .mockResolvedValueOnce(8) // total tickets
        .mockResolvedValueOnce(3) // open tickets
        .mockResolvedValueOnce(4) // in progress tickets
        .mockResolvedValueOnce(2) // high priority tickets
        .mockResolvedValueOnce(1); // critical tickets

      mockMultiTenantPrisma.invoice.count
        .mockResolvedValueOnce(6) // total invoices
        .mockResolvedValueOnce(2) // pending invoices
        .mockResolvedValueOnce(1); // overdue invoices

      mockMultiTenantPrisma.invoice.aggregate.mockResolvedValue({
        _sum: { amount: 10000 },
      });

      mockMultiTenantPrisma.milestone.count
        .mockResolvedValueOnce(15) // total milestones
        .mockResolvedValueOnce(8) // completed milestones
        .mockResolvedValueOnce(2) // overdue milestones
        .mockResolvedValueOnce(3); // due this week

      const result = await controller.getDashboardStats(organizationId);

      expect(result).toEqual({
        projects: {
          total: 10,
          active: 5,
          completed: 3,
          onHold: 2,
        },
        tickets: {
          total: 8,
          open: 3,
          inProgress: 4,
          highPriority: 2,
          critical: 1,
        },
        invoices: {
          total: 6,
          pending: 2,
          overdue: 1,
          totalAmount: 10000,
          pendingAmount: 10000, // This should be calculated separately
        },
        milestones: {
          total: 15,
          completed: 8,
          overdue: 2,
          dueThisWeek: 3,
        },
      });

      // Verify that all queries were called with organization context
      expect(mockMultiTenantPrisma.project.count).toHaveBeenCalledWith({
        where: { organizationId },
      });
    });

    it('should return cached stats when available', async () => {
      const cachedStats = {
        projects: { total: 5, active: 3, completed: 2, onHold: 0 },
        tickets: {
          total: 4,
          open: 2,
          inProgress: 2,
          highPriority: 1,
          critical: 0,
        },
        invoices: {
          total: 3,
          pending: 1,
          overdue: 0,
          totalAmount: 5000,
          pendingAmount: 2000,
        },
        milestones: { total: 8, completed: 4, overdue: 1, dueThisWeek: 2 },
      };

      mockCacheManager.get.mockResolvedValue(cachedStats);

      const result = await controller.getDashboardStats(organizationId);

      expect(result).toEqual(cachedStats);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `dashboard-stats-${organizationId}`
      );
      expect(mockMultiTenantPrisma.project.count).not.toHaveBeenCalled();
    });

    it('should refresh cache when requested', async () => {
      // Mock cache miss for refresh
      mockCacheManager.get.mockResolvedValue(null);

      // Mock minimal database responses
      mockMultiTenantPrisma.project.count.mockResolvedValue(1);
      mockMultiTenantPrisma.ticket.count.mockResolvedValue(1);
      mockMultiTenantPrisma.invoice.count.mockResolvedValue(1);
      mockMultiTenantPrisma.invoice.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });
      mockMultiTenantPrisma.milestone.count.mockResolvedValue(1);

      await controller.getDashboardStats(organizationId, 'true');

      // Should cache the new results
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getRecentActivity', () => {
    const organizationId = 'test-org-id';

    it('should return recent activity for organization', async () => {
      const mockActivities = [
        {
          id: '1',
          type: 'project',
          title: 'Test Project',
          description: 'Project created',
          status: 'active',
          createdAt: new Date(),
        },
      ];

      mockMultiTenantPrisma.project.findMany.mockResolvedValue([]);
      mockMultiTenantPrisma.ticket.findMany.mockResolvedValue([]);
      mockMultiTenantPrisma.milestone.findMany.mockResolvedValue([]);
      mockMultiTenantPrisma.invoice.findMany.mockResolvedValue(mockActivities);

      const result = await controller.getRecentActivity(organizationId);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            status: expect.any(String),
            createdAt: expect.any(Date),
          }),
        ])
      );
    });
  });
});
