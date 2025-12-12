import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let cacheService: CacheService;

  const mockPrismaService = {
    project: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectMetrics', () => {
    const projectId = 'project-123';
    const organizationId = 'org-123';

    it('should return cached metrics when available', async () => {
      const cachedMetrics = {
        projectId,
        organizationId,
        totalTasks: 10,
        completedTasks: 8,
        overdueTasks: 2,
        totalMilestones: 5,
        completedMilestones: 3,
        averageTaskDuration: 3.5,
        budgetUtilization: 75,
        timelineAdherence: 85,
        teamProductivity: 2.5,
        riskScore: 25,
        clientSatisfactionPrediction: 88,
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedMetrics));

      const result = await service.getProjectMetrics(projectId, organizationId);

      expect(result).toEqual(cachedMetrics);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        `analytics:project:${projectId}:${JSON.stringify({})}`
      );
      expect(mockPrismaService.project.findFirst).not.toHaveBeenCalled();
    });

    it('should calculate and return project metrics when not cached', async () => {
      const mockProject = {
        id: projectId,
        organizationId,
        budget: 100000,
        startAt: '2024-01-01',
        dueAt: '2024-06-01',
        tasks: [
          {
            id: 'task-1',
            status: 'done',
            assigneeId: 'user-1',
            createdAt: '2024-01-02',
            updatedAt: '2024-01-05',
            dueAt: '2024-01-10',
          },
          {
            id: 'task-2',
            status: 'in_progress',
            assigneeId: 'user-2',
            createdAt: '2024-01-03',
            updatedAt: '2024-01-06',
            dueAt: '2024-01-15',
          },
        ],
        milestones: [
          {
            id: 'milestone-1',
            status: 'completed',
          },
          {
            id: 'milestone-2',
            status: 'pending',
          },
        ],
        invoices: [
          {
            status: 'paid',
            amount: 75000,
          },
        ],
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.getProjectMetrics(projectId, organizationId);

      expect(result).toMatchObject({
        projectId,
        organizationId,
        totalTasks: 2,
        completedTasks: 1,
        overdueTasks: expect.any(Number),
        totalMilestones: 2,
        completedMilestones: 1,
        averageTaskDuration: expect.any(Number),
        budgetUtilization: 75,
        timelineAdherence: expect.any(Number),
        teamProductivity: expect.any(Number),
        riskScore: expect.any(Number),
        clientSatisfactionPrediction: expect.any(Number),
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `analytics:project:${projectId}:${JSON.stringify({})}`,
        expect.any(String),
        300
      );
      expect(mockAuditService.log).toHaveBeenCalledWith({
        actorId: 'system',
        organizationId,
        action: 'analytics.project_metrics_viewed',
        target: projectId,
        meta: { filters: {} },
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.getProjectMetrics(projectId, organizationId)
      ).rejects.toThrow('Project not found');
    });
  });

  describe('getOrganizationAnalytics', () => {
    const organizationId = 'org-123';

    it('should return cached organization analytics when available', async () => {
      const cachedAnalytics = {
        overview: {
          totalProjects: 5,
          activeProjects: 3,
          completedProjects: 2,
          totalRevenue: 250000,
          averageProjectDuration: 45,
          clientSatisfactionScore: 87,
        },
        trends: {
          projectCompletion: [],
          revenue: [],
          teamProductivity: [],
        },
        topPerformers: [],
        riskAnalysis: {
          highRiskProjects: 1,
          budgetOverruns: 0,
          timelineDelays: 2,
        },
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedAnalytics));

      const result = await service.getOrganizationAnalytics(organizationId);

      expect(result).toEqual(cachedAnalytics);
      expect(mockPrismaService.project.findMany).not.toHaveBeenCalled();
    });

    it('should calculate and return organization analytics when not cached', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          status: 'active',
          budget: 100000,
          startAt: '2024-01-01',
          dueAt: '2024-06-01',
          tasks: [
            { status: 'done', assigneeId: 'user-1' },
            { status: 'in_progress', assigneeId: 'user-2' },
          ],
          milestones: [{ status: 'completed' }, { status: 'pending' }],
          invoices: [{ status: 'paid', amount: 75000 }],
          organization: {
            members: [
              { user: { id: 'user-1', name: 'User 1' } },
              { user: { id: 'user-2', name: 'User 2' } },
            ],
          },
        },
        {
          id: 'project-2',
          status: 'completed',
          budget: 80000,
          startAt: '2023-06-01',
          dueAt: '2023-12-01',
          tasks: [
            { status: 'done', assigneeId: 'user-1' },
            { status: 'done', assigneeId: 'user-2' },
          ],
          milestones: [{ status: 'completed' }, { status: 'completed' }],
          invoices: [{ status: 'paid', amount: 80000 }],
          organization: {
            members: [
              { user: { id: 'user-1', name: 'User 1' } },
              { user: { id: 'user-2', name: 'User 2' } },
            ],
          },
        },
      ];

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.getOrganizationAnalytics(organizationId);

      expect(result).toMatchObject({
        overview: {
          totalProjects: 2,
          activeProjects: 1,
          completedProjects: 1,
          totalRevenue: 155000,
          averageProjectDuration: expect.any(Number),
          clientSatisfactionScore: 85,
        },
        trends: {
          projectCompletion: expect.any(Array),
          revenue: expect.any(Array),
          teamProductivity: expect.any(Array),
        },
        topPerformers: expect.any(Array),
        riskAnalysis: {
          highRiskProjects: expect.any(Number),
          budgetOverruns: expect.any(Number),
          timelineDelays: expect.any(Number),
        },
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `analytics:org:${organizationId}:${JSON.stringify({})}`,
        expect.any(String),
        600
      );
    });
  });

  describe('getPredictiveAnalytics', () => {
    const projectId = 'project-123';
    const organizationId = 'org-123';

    it('should return predictive analytics for a project', async () => {
      const mockProject = {
        id: projectId,
        organizationId,
        budget: 100000,
        startAt: '2024-01-01',
        dueAt: '2024-06-01',
        tasks: [
          {
            status: 'done',
            assigneeId: 'user-1',
            createdAt: '2024-01-02',
            updatedAt: '2024-01-05',
          },
        ],
        milestones: [{ status: 'completed' }],
        invoices: [{ status: 'paid', amount: 75000 }],
      };

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.getPredictiveAnalytics(
        projectId,
        organizationId
      );

      expect(result).toMatchObject({
        estimatedCompletion: expect.any(Date),
        budgetOverrunRisk: expect.any(Number),
        timelineDelayRisk: expect.any(Number),
        qualityScore: expect.any(Number),
        recommendedActions: expect.any(Array),
      });

      expect(mockAuditService.log).toHaveBeenCalledWith({
        actorId: 'system',
        organizationId,
        action: 'analytics.predictive_viewed',
        target: projectId,
        meta: { predictions: expect.any(Object) },
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.getPredictiveAnalytics(projectId, organizationId)
      ).rejects.toThrow('Project not found');
    });
  });

  describe('calculateProjectMetrics', () => {
    it('should calculate metrics correctly for a project', async () => {
      const mockProject = {
        id: 'project-1',
        organizationId: 'org-1',
        budget: 100000,
        startAt: '2024-01-01',
        dueAt: '2024-06-01',
        tasks: [
          {
            status: 'done',
            assigneeId: 'user-1',
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-05'),
            dueAt: new Date('2024-01-10'),
          },
          {
            status: 'in_progress',
            assigneeId: 'user-2',
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-06'),
            dueAt: new Date('2024-01-15'),
          },
          {
            status: 'todo',
            assigneeId: 'user-1',
            createdAt: new Date('2024-01-04'),
            updatedAt: new Date('2024-01-04'),
            dueAt: new Date('2024-01-20'),
          },
        ],
        milestones: [{ status: 'completed' }, { status: 'pending' }],
        invoices: [
          { status: 'paid', amount: 75000 },
          { status: 'pending', amount: 25000 },
        ],
      };

      // Access private method through prototype for testing
      const metrics = await (service as any).calculateProjectMetrics(
        mockProject
      );

      expect(metrics).toMatchObject({
        projectId: 'project-1',
        organizationId: 'org-1',
        totalTasks: 3,
        completedTasks: 1,
        totalMilestones: 2,
        completedMilestones: 1,
        budgetUtilization: 75,
        teamProductivity: expect.any(Number),
        riskScore: expect.any(Number),
        clientSatisfactionPrediction: expect.any(Number),
      });
    });
  });

  describe('buildTaskFilters', () => {
    it('should return undefined when no filters provided', () => {
      const result = (service as any).buildTaskFilters(undefined);
      expect(result).toBeUndefined();
    });

    it('should build filters correctly', () => {
      const filters = {
        status: ['done', 'in_progress'],
        assigneeId: 'user-1',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      const result = (service as any).buildTaskFilters(filters);

      expect(result).toEqual({
        status: { in: ['done', 'in_progress'] },
        assigneeId: 'user-1',
        createdAt: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-01-31'),
        },
      });
    });
  });

  describe('buildProjectFilters', () => {
    it('should return undefined when no filters provided', () => {
      const result = (service as any).buildProjectFilters(undefined);
      expect(result).toBeUndefined();
    });

    it('should build filters correctly', () => {
      const filters = {
        status: ['active', 'completed'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      const result = (service as any).buildProjectFilters(filters);

      expect(result).toEqual({
        status: { in: ['active', 'completed'] },
        createdAt: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-01-31'),
        },
      });
    });
  });
});
