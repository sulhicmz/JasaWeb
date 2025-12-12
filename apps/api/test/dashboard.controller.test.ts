import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { MultiTenantPrismaService } from '../src/common/database/multi-tenant-prisma.service';
import { PrismaService } from '../src/common/database/prisma.service';
import { Cache } from 'cache-manager';
import { DashboardGateway } from '../src/dashboard/dashboard.gateway';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockPrismaService: jest.Mocked<MultiTenantPrismaService>;
  let mockCacheManager: jest.Mocked<Cache>;
  let mockDashboardGateway: jest.Mocked<DashboardGateway>;

  beforeEach(async () => {
    mockPrismaService = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      ticket: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      milestone: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    mockDashboardGateway = {
      broadcastDashboardUpdate: jest.fn(),
    } as any;

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
              findFirst: jest.fn().mockResolvedValue({
                role: 'org_owner',
              }),
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
        Reflector,
        {
          provide: RolesGuard,
          useValue: {
            canActivate: () => true, // Mock the guard to always allow access
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
        { status: 'in-progress', dueAt: new Date('2022-12-01') }, // Overdue
      ];

      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue(
        projectsData
      );
      (mockPrismaService.ticket.findMany as jest.Mock).mockResolvedValue(
        ticketsData
      );
      (mockPrismaService.invoice.findMany as jest.Mock).mockResolvedValue(
        invoicesData
      );
      (mockPrismaService.milestone.findMany as jest.Mock).mockResolvedValue(
        milestonesData
      );

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
        overdue: 1,
        dueThisWeek: expect.any(Number),
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard-stats-org-123',
        expect.any(Object),
        300 // 5 minutes
      );
    });

it('should handle empty data gracefully', async () => {
      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.ticket.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.milestone.findMany as jest.Mock).mockResolvedValue([]);

      const result = await controller.getDashboardStats('org-123');

      expect(result.projects.total).toBe(0);
      expect(result.tickets.total).toBe(0);
      expect(result.invoices.total).toBe(0);
      expect(result.milestones.total).toBe(0);
    });
      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.ticket.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.milestone.findMany as jest.Mock).mockResolvedValue([]);

      const result = await controller.getDashboardStats('org-123');

      expect(result.projects?.total).toBe(0);
      expect(result.tickets?.total).toBe(0);
      expect(result.invoices?.total).toBe(0);
      expect(result.milestones?.total).toBe(0);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activities sorted by date', async () => {
      const projectsData = [
        { id: '1', updatedAt: new Date('2023-01-02'), name: 'Project A' },
      ];
      const ticketsData = [
        { id: '1', createdAt: new Date('2023-01-03'), type: 'support', status: 'open', priority: 'high' },
      ];
      const invoicesData = [
        { id: '1', createdAt: new Date('2023-01-02'), amount: 5000, status: 'issued', dueAt: new Date('2023-01-15') },
      ];
      const milestonesData = [
        { id: '1', createdAt: new Date('2023-01-01'), title: 'Milestone A', status: 'completed', dueAt: new Date('2023-01-10') },
      ];

      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue(
        projectsData
      );
      (mockPrismaService.ticket.findMany as jest.Mock).mockResolvedValue(
        ticketsData
      );
      (mockPrismaService.milestone.findMany as jest.Mock).mockResolvedValue(
        milestonesData
      );
      (mockPrismaService.invoice.findMany as jest.Mock).mockResolvedValue(
        invoicesData
      );

      const result = await controller.getRecentActivity('org-123');

      expect(result[0]?.type).toBe('ticket'); // Most recent (2023-01-03)
      expect(result[1]?.type).toBe('invoice'); // 2023-01-02
      expect(result[2]?.type).toBe('project'); // 2023-01-02 (updatedAt)
      expect(result[3]?.type).toBe('milestone'); // 2023-01-01
    });

    it('should handle empty activity data', async () => {
      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.ticket.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.milestone.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.invoice.findMany as jest.Mock).mockResolvedValue([]);

      const result = await controller.getRecentActivity('org-123');

      expect(result).toEqual([]);
    });
  });

  describe('getProjectsOverview', () => {
    it('should return projects overview with metrics', async () => {
      const projectsData = [
        {
          id: '1',
          name: 'Project A',
          status: 'active',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          startAt: new Date('2023-01-01'),
          dueAt: new Date('2023-03-01'),
          milestones: [
            { id: 'm1', status: 'completed', dueAt: new Date('2023-02-01') },
            { id: 'm2', status: 'in-progress', dueAt: new Date('2023-03-01') },
          ],
          tickets: [
            { id: 't1', status: 'open', priority: 'high' },
            { id: 't2', status: 'in-progress', priority: 'medium' },
          ],
          _count: {
            milestones: 2,
            tickets: 2,
          },
        },
      ];

      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue(
        projectsData
      );

      const result = await controller.getProjectsOverview('org-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Project A',
        description: null,
        status: 'active',
        progress: 50,
        totalMilestones: 2,
        completedMilestones: 1,
        openTickets: 2,
        highPriorityTickets: 1,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        startAt: new Date('2023-01-01'),
        dueAt: new Date('2023-03-01'),
      });
    });
  });

  describe('notifyDashboardUpdate', () => {
    it('should send dashboard update notification', async () => {
      const body = { type: 'stats', data: { message: 'Test update' } };

      await controller.notifyDashboardUpdate(body, 'org-123', 'user-123');

      expect(
        mockDashboardGateway.broadcastDashboardUpdate
      ).toHaveBeenCalledWith({
        type: 'stats',
        data: { ...body.data, userId: 'user-123' },
        timestamp: expect.any(Date),
        organizationId: 'org-123',
      });
    });
  });

  describe('refreshDashboardCache', () => {
    it('should refresh dashboard cache and notify clients', async () => {
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
});
