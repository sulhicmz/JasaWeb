/// <reference types="@types/jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { MultiTenantPrismaService } from '../src/common/database/multi-tenant-prisma.service';
import { PrismaService } from '../src/common/database/prisma.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Cache } from 'cache-manager';
import { DashboardGateway } from '../src/dashboard/dashboard.gateway';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockPrismaService: Partial<MultiTenantPrismaService>;
  let mockBasePrismaService: Partial<PrismaService>;
  let mockCacheManager: Partial<Cache>;
  let mockDashboardGateway: Partial<DashboardGateway>;

  beforeEach(async () => {
    mockPrismaService = {
      project: {
        findMany: jest.fn(),
      } as any,
      ticket: {
        findMany: jest.fn(),
      } as any,
      invoice: {
        findMany: jest.fn(),
      } as any,
      milestone: {
        findMany: jest.fn(),
      } as any,
    } as any;

    mockBasePrismaService = {
      membership: {
        findFirst: jest.fn(),
      } as any,
    } as any;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

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
          useValue: mockBasePrismaService,
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
        { status: 'in-progress', dueAt: new Date('2024-01-01') },
      ];

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
        300000
      );
    });

    it('should force refresh when refresh parameter is true', async () => {
      (mockCacheManager.get as jest.Mock).mockResolvedValue({
        some: 'cached_data',
      });
      (mockPrismaService.project as any).findMany.mockResolvedValue([]);
      (mockPrismaService.ticket as any).findMany.mockResolvedValue([]);
      (mockPrismaService.invoice as any).findMany.mockResolvedValue([]);
      (mockPrismaService.milestone as any).findMany.mockResolvedValue([]);

      await controller.getDashboardStats('org-123', 'true');

      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect((mockPrismaService.project as any).findMany).toHaveBeenCalled();
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

      const result = await controller.getRecentActivity('org-123', '5');

      expect(result).toHaveLength(4);
      expect(result[0]?.type).toBe('ticket'); // Most recent (2023-01-03)
      expect(result[1]?.type).toBe('project'); // 2023-01-02 (updated)
      expect(result[2]?.type).toBe('invoice'); // 2023-01-02 (created)
      expect(result[3]?.type).toBe('milestone'); // 2023-01-01
    });

    it('should limit results to specified number', async () => {
      (mockPrismaService.project as any).findMany.mockResolvedValue([]);
      (mockPrismaService.ticket as any).findMany.mockResolvedValue([]);
      (mockPrismaService.milestone as any).findMany.mockResolvedValue([]);
      (mockPrismaService.invoice as any).findMany.mockResolvedValue([]);

      // Should cap at 2 items
      await controller.getRecentActivity('org-123', '2');
      expect((mockPrismaService.project as any).findMany).toHaveBeenCalledWith(
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

      (mockPrismaService.project as any).findMany.mockResolvedValue(
        projectsData
      );

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
