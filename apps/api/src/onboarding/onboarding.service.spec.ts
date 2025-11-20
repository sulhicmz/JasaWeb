import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService, OnboardingStep } from './onboarding.service';
import { PrismaService } from '../common/database/prisma.service';
import { OnboardingStatus } from '../users/entities/user.entity';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnboardingSteps', () => {
    it('should return all onboarding steps', () => {
      const steps = service.getOnboardingSteps();

      expect(steps).toHaveLength(7);
      expect(steps[0].id).toBe('welcome');
      expect(steps[0].required).toBe(true);
      expect(steps[5].required).toBe(false); // file_management is optional
    });
  });

  describe('getOnboardingProgress', () => {
    const userId = 'user-123';

    it('should return user onboarding progress', async () => {
      const mockUser = {
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
        onboardingStep: 2,
        onboardingCompletedAt: null,
        onboardingPreferences: {
          completedSteps: ['welcome', 'profile_setup'],
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getOnboardingProgress(userId);

      expect(result).toEqual({
        userId,
        status: OnboardingStatus.IN_PROGRESS,
        currentStep: 2,
        completedSteps: ['welcome', 'profile_setup'],
        totalSteps: 5, // Only required steps
        progressPercentage: 40, // 2 of 5 required steps completed
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getOnboardingProgress(userId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle missing preferences gracefully', async () => {
      const mockUser = {
        onboardingStatus: OnboardingStatus.NOT_STARTED,
        onboardingStep: 0,
        onboardingCompletedAt: null,
        onboardingPreferences: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getOnboardingProgress(userId);

      expect(result.completedSteps).toEqual([]);
      expect(result.progressPercentage).toBe(0);
    });
  });

  describe('startOnboarding', () => {
    const userId = 'user-123';

    it('should start onboarding for user', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      await service.startOnboarding(userId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          onboardingStatus: OnboardingStatus.IN_PROGRESS,
          onboardingStep: 0,
          onboardingPreferences: {
            startedAt: expect.any(String),
            completedSteps: [],
          },
        },
      });
    });
  });

  describe('updateOnboardingStep', () => {
    const userId = 'user-123';

    beforeEach(() => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        onboardingPreferences: {
          completedSteps: ['welcome'],
        },
        onboardingStep: 1,
      });
    });

    it('should mark step as completed', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.updateOnboardingStep(
        userId,
        'profile_setup',
        true
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          onboardingPreferences: {
            completedSteps: ['welcome', 'profile_setup'],
            lastUpdated: expect.any(String),
          },
          onboardingStep: 2, // Next step
        },
      });
    });

    it('should mark step as uncompleted', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      await service.updateOnboardingStep(userId, 'welcome', false);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          onboardingPreferences: {
            completedSteps: [],
            lastUpdated: expect.any(String),
          },
        },
      });
    });

    it('should complete onboarding when all required steps are done', async () => {
      // Mock user with all required steps completed except the last one
      mockPrismaService.user.findUnique.mockResolvedValue({
        onboardingPreferences: {
          completedSteps: [
            'welcome',
            'profile_setup',
            'dashboard_tour',
            'project_overview',
          ],
        },
        onboardingStep: 4,
      });

      mockPrismaService.user.update.mockResolvedValue({});

      await service.updateOnboardingStep(userId, 'approval_workflow', true);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          onboardingPreferences: {
            completedSteps: [
              'welcome',
              'profile_setup',
              'dashboard_tour',
              'project_overview',
              'approval_workflow',
            ],
            lastUpdated: expect.any(String),
          },
          onboardingStep: 5, // Next step
          onboardingStatus: OnboardingStatus.COMPLETED,
          onboardingCompletedAt: expect.any(Date),
        },
      });
    });
  });

  describe('skipOnboarding', () => {
    const userId = 'user-123';

    it('should skip onboarding for user', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      await service.skipOnboarding(userId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          onboardingStatus: OnboardingStatus.SKIPPED,
          onboardingPreferences: {
            skippedAt: expect.any(String),
            reason: 'user_skipped',
          },
        },
      });
    });
  });

  describe('resetOnboarding', () => {
    const userId = 'user-123';

    it('should reset onboarding progress', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      await service.resetOnboarding(userId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          onboardingStatus: OnboardingStatus.NOT_STARTED,
          onboardingStep: 0,
          onboardingCompletedAt: null,
          onboardingPreferences: null,
        },
      });
    });
  });

  describe('getOnboardingAnalytics', () => {
    it('should return onboarding analytics', async () => {
      const mockUsers = [
        {
          onboardingStatus: OnboardingStatus.NOT_STARTED,
          onboardingStep: 0,
          onboardingCompletedAt: null,
          createdAt: new Date('2024-01-01'),
        },
        {
          onboardingStatus: OnboardingStatus.IN_PROGRESS,
          onboardingStep: 2,
          onboardingCompletedAt: null,
          createdAt: new Date('2024-01-01'),
        },
        {
          onboardingStatus: OnboardingStatus.COMPLETED,
          onboardingStep: 5,
          onboardingCompletedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
        },
        {
          onboardingStatus: OnboardingStatus.SKIPPED,
          onboardingStep: 0,
          onboardingCompletedAt: null,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getOnboardingAnalytics();

      expect(result).toEqual({
        totalUsers: 4,
        distribution: {
          notStarted: 1,
          inProgress: 1,
          completed: 1,
          skipped: 1,
        },
        completionRate: 25, // 1 of 4 users completed
        averageCompletionTime: 24, // 1 day in hours
      });
    });

    it('should handle empty user list', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getOnboardingAnalytics();

      expect(result.totalUsers).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.averageCompletionTime).toBe(0);
    });
  });
});
