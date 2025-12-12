import { Test, TestingModule } from '@nestjs/testing';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { PrismaService } from '../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let cacheService: CacheService;

  const mockPrismaService = {
    project: {
      findFirst: jest.fn(),
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
        PredictiveAnalyticsService,
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

    service = module.get<PredictiveAnalyticsService>(
      PredictiveAnalyticsService
    );
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trainModels', () => {
    const organizationId = 'org-123';

    it('should train models successfully with sufficient data', async () => {
      const mockTrainingData = Array.from({ length: 15 }, (_, i) => ({
        projectId: `project-${i}`,
        features: {
          teamSize: 3,
          projectComplexity: 0.7,
          budgetSize: 100000,
          taskCompletionRate: 0.8,
        },
        actualOutcome: {
          timelineAdherence: 0.9,
          budgetUtilization: 0.85,
          qualityScore: 0.88,
          riskScore: 0.2,
        },
      }));

      mockPrismaService.project.findMany.mockResolvedValue(mockTrainingData);

      const result = await service.trainModels(organizationId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully trained');
      expect(mockAuditService.log).toHaveBeenCalledWith({
        actorId: 'system',
        organizationId,
        action: 'analytics.models_trained',
        target: organizationId,
        meta: {
          modelsTrained: ['timeline', 'budget', 'quality', 'risk'],
          dataPoints: 15,
        },
      });
    });

    it('should fail with insufficient data', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const result = await service.trainModels(organizationId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient historical data');
    });

    it('should handle training errors gracefully', async () => {
      mockPrismaService.project.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const result = await service.trainModels(organizationId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Model training failed');
      expect(mockAuditService.log).toHaveBeenCalledWith({
        actorId: 'system',
        organizationId,
        action: 'analytics.model_training_failed',
        target: organizationId,
        meta: { error: 'Database error' },
      });
    });
  });

  describe('predictTimeline', () => {
    const projectId = 'project-123';
    const organizationId = 'org-123';

    it('should return cached prediction when available', async () => {
      const cachedPrediction = {
        prediction: 0.85,
        confidence: 0.9,
        factors: [
          {
            feature: 'teamSize',
            importance: 0.8,
            value: 3,
          },
        ],
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedPrediction));

      const result = await service.predictTimeline(projectId, organizationId);

      expect(result).toEqual(cachedPrediction);
      expect(mockPrismaService.project.findFirst).not.toHaveBeenCalled();
    });

    it('should calculate and return timeline prediction when not cached', async () => {
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
          },
          {
            status: 'in_progress',
            assigneeId: 'user-2',
          },
        ],
        milestones: [{ status: 'completed' }, { status: 'pending' }],
        organization: {
          members: [{ id: 'user-1' }, { id: 'user-2' }],
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.predictTimeline(projectId, organizationId);

      expect(result).toMatchObject({
        prediction: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.any(Array),
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `prediction:timeline:${projectId}`,
        expect.any(String),
        3600
      );
      expect(mockAuditService.log).toHaveBeenCalledWith({
        actorId: 'system',
        organizationId,
        action: 'analytics.timeline_prediction',
        target: projectId,
        meta: {
          prediction: expect.any(Object),
          features: expect.any(Object),
        },
      });
    });

    it('should throw error when project not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.predictTimeline(projectId, organizationId)
      ).rejects.toThrow('Project not found');
    });
  });

  describe('predictBudget', () => {
    const projectId = 'project-123';
    const organizationId = 'org-123';

    it('should return cached budget prediction when available', async () => {
      const cachedPrediction = {
        prediction: 0.75,
        confidence: 0.82,
        factors: [
          {
            feature: 'initialBudget',
            importance: 0.9,
            value: 100000,
          },
        ],
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedPrediction));

      const result = await service.predictBudget(projectId, organizationId);

      expect(result).toEqual(cachedPrediction);
    });

    it('should calculate and return budget prediction when not cached', async () => {
      const mockProject = {
        id: projectId,
        organizationId,
        budget: 100000,
        startAt: '2024-01-01',
        dueAt: '2024-06-01',
        tasks: [],
        milestones: [],
        invoices: [
          { status: 'paid', amount: 75000 },
          { status: 'pending', amount: 25000 },
        ],
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.predictBudget(projectId, organizationId);

      expect(result).toMatchObject({
        prediction: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.any(Array),
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `prediction:budget:${projectId}`,
        expect.any(String),
        3600
      );
    });
  });

  describe('predictQuality', () => {
    const projectId = 'project-123';
    const organizationId = 'org-123';

    it('should return cached quality prediction when available', async () => {
      const cachedPrediction = {
        prediction: 0.88,
        confidence: 0.78,
        factors: [
          {
            feature: 'teamExperience',
            importance: 0.7,
            value: 0.8,
          },
        ],
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedPrediction));

      const result = await service.predictQuality(projectId, organizationId);

      expect(result).toEqual(cachedPrediction);
    });

    it('should calculate and return quality prediction when not cached', async () => {
      const mockProject = {
        id: projectId,
        organizationId,
        tasks: [],
        milestones: [],
        approvals: [
          { status: 'approved' },
          { status: 'approved' },
          { status: 'pending' },
        ],
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.predictQuality(projectId, organizationId);

      expect(result).toMatchObject({
        prediction: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.any(Array),
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `prediction:quality:${projectId}`,
        expect.any(String),
        3600
      );
    });
  });

  describe('predictRisk', () => {
    const projectId = 'project-123';
    const organizationId = 'org-123';

    it('should return cached risk prediction when available', async () => {
      const cachedPrediction = {
        prediction: 0.25,
        confidence: 0.88,
        factors: [
          {
            feature: 'teamStability',
            importance: 0.9,
            value: 0.95,
          },
        ],
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedPrediction));

      const result = await service.predictRisk(projectId, organizationId);

      expect(result).toEqual(cachedPrediction);
    });

    it('should calculate and return risk prediction when not cached', async () => {
      const mockProject = {
        id: projectId,
        organizationId,
        tasks: [
          {
            status: 'done',
            dueAt: '2024-01-10',
          },
          {
            status: 'in_progress',
            dueAt: '2024-01-05', // Overdue
          },
        ],
        milestones: [],
        tickets: [{ priority: 'critical' }, { priority: 'low' }],
        organization: {
          members: [{ id: 'user-1' }, { id: 'user-2' }],
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.predictRisk(projectId, organizationId);

      expect(result).toMatchObject({
        prediction: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.any(Array),
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `prediction:risk:${projectId}`,
        expect.any(String),
        3600
      );
    });
  });

  describe('getModelStatus', () => {
    it('should return status of all models', async () => {
      const result = await service.getModelStatus();

      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('budget');
      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('risk');

      expect(result.timeline).toMatchObject({
        type: 'timeline',
        accuracy: expect.any(Number),
        lastTrained: expect.any(Date),
        features: expect.any(Array),
      });
    });
  });

  describe('feature extraction methods', () => {
    const mockProject = {
      id: 'project-1',
      budget: 100000,
      startAt: '2024-01-01',
      dueAt: '2024-06-01',
      tasks: [
        { status: 'done', assigneeId: 'user-1' },
        { status: 'in_progress', assigneeId: 'user-2' },
        { status: 'todo', assigneeId: 'user-1' },
      ],
      milestones: [{ status: 'completed' }, { status: 'pending' }],
      invoices: [{ status: 'paid', amount: 75000 }],
      approvals: [{ status: 'approved' }, { status: 'pending' }],
      tickets: [
        { priority: 'critical' },
        { priority: 'high' },
        { priority: 'low' },
      ],
    };

    it('should extract timeline features correctly', () => {
      const features = (service as any).extractTimelineFeatures(mockProject);

      expect(features).toMatchObject({
        teamSize: expect.any(Number),
        projectComplexity: expect.any(Number),
        budgetSize: 100000,
        historicalPerformance: expect.any(Number),
        taskCompletionRate: expect.any(Number),
        milestoneAdherence: expect.any(Number),
      });
    });

    it('should extract budget features correctly', () => {
      const features = (service as any).extractBudgetFeatures(mockProject);

      expect(features).toMatchObject({
        initialBudget: 100000,
        projectDuration: expect.any(Number),
        teamExperience: expect.any(Number),
        scopeComplexity: expect.any(Number),
        historicalBudgetAdherence: expect.any(Number),
        changeRequestFrequency: expect.any(Number),
      });
    });

    it('should extract quality features correctly', () => {
      const features = (service as any).extractQualityFeatures(mockProject);

      expect(features).toMatchObject({
        teamExperience: expect.any(Number),
        projectComplexity: expect.any(Number),
        testingCoverage: expect.any(Number),
        codeReviewThoroughness: expect.any(Number),
        clientCommunication: expect.any(Number),
        requirementClarity: expect.any(Number),
      });
    });

    it('should extract risk features correctly', () => {
      const features = (service as any).extractRiskFeatures(mockProject);

      expect(features).toMatchObject({
        teamStability: expect.any(Number),
        requirementVolatility: expect.any(Number),
        technicalComplexity: expect.any(Number),
        budgetConstraints: expect.any(Number),
        timelinePressure: expect.any(Number),
        stakeholderAlignment: expect.any(Number),
      });
    });
  });

  describe('utility methods', () => {
    it('should calculate project complexity correctly', () => {
      const project = {
        tasks: Array.from({ length: 25 }), // 25 tasks
        milestones: Array.from({ length: 5 }), // 5 milestones
        budget: 50000,
      };

      const complexity = (service as any).calculateProjectComplexity(project);
      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThanOrEqual(1);
    });

    it('should calculate project duration correctly', () => {
      const project = {
        startAt: '2024-01-01',
        dueAt: '2024-01-31',
      };

      const duration = (service as any).calculateProjectDuration(project);
      expect(duration).toBe(30); // 30 days
    });

    it('should calculate timeline pressure correctly', () => {
      const project = {
        startAt: '2024-01-01',
        dueAt: '2024-01-15',
        tasks: Array.from({ length: 20 }), // 20 tasks in 14 days
      };

      const pressure = (service as any).calculateTimelinePressure(project);
      expect(pressure).toBeGreaterThan(0);
      expect(pressure).toBeLessThanOrEqual(1);
    });
  });
});
