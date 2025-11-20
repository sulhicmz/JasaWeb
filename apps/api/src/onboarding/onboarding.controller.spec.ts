import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingStatus } from '../users/entities/user.entity';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let service: OnboardingService;

  const mockOnboardingService = {
    getOnboardingSteps: jest.fn(),
    getOnboardingProgress: jest.fn(),
    startOnboarding: jest.fn(),
    updateOnboardingStep: jest.fn(),
    skipOnboarding: jest.fn(),
    resetOnboarding: jest.fn(),
    getOnboardingAnalytics: jest.fn(),
  };

  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: mockOnboardingService,
        },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
    service = module.get<OnboardingService>(OnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnboardingSteps', () => {
    it('should return onboarding steps', async () => {
      const expectedSteps = [
        { id: 'welcome', title: 'Welcome to JasaWeb', required: true },
      ];

      mockOnboardingService.getOnboardingSteps.mockReturnValue(expectedSteps);

      const result = await controller.getOnboardingSteps();

      expect(result).toEqual(expectedSteps);
      expect(service.getOnboardingSteps).toHaveBeenCalled();
    });
  });

  describe('getOnboardingProgress', () => {
    it('should return user onboarding progress', async () => {
      const expectedProgress = {
        userId: 'user-123',
        status: OnboardingStatus.IN_PROGRESS,
        currentStep: 2,
        completedSteps: ['welcome'],
        totalSteps: 5,
        progressPercentage: 20,
      };

      mockOnboardingService.getOnboardingProgress.mockResolvedValue(
        expectedProgress
      );

      const result = await controller.getOnboardingProgress({ user: mockUser });

      expect(result).toEqual(expectedProgress);
      expect(service.getOnboardingProgress).toHaveBeenCalledWith('user-123');
    });
  });

  describe('startOnboarding', () => {
    it('should start onboarding for user', async () => {
      mockOnboardingService.startOnboarding.mockResolvedValue(undefined);

      const result = await controller.startOnboarding({ user: mockUser });

      expect(result).toEqual({ message: 'Onboarding started successfully' });
      expect(service.startOnboarding).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateOnboardingStep', () => {
    it('should update onboarding step progress', async () => {
      const updateDto = { stepId: 'welcome', completed: true };
      const expectedProgress = {
        userId: 'user-123',
        status: OnboardingStatus.IN_PROGRESS,
        currentStep: 1,
        completedSteps: ['welcome'],
        totalSteps: 5,
        progressPercentage: 20,
      };

      mockOnboardingService.updateOnboardingStep.mockResolvedValue(
        expectedProgress
      );

      const result = await controller.updateOnboardingStep(
        { user: mockUser },
        updateDto
      );

      expect(result).toEqual(expectedProgress);
      expect(service.updateOnboardingStep).toHaveBeenCalledWith(
        'user-123',
        'welcome',
        true
      );
    });
  });

  describe('skipOnboarding', () => {
    it('should skip onboarding for user', async () => {
      mockOnboardingService.skipOnboarding.mockResolvedValue(undefined);

      const result = await controller.skipOnboarding({ user: mockUser });

      expect(result).toEqual({ message: 'Onboarding skipped' });
      expect(service.skipOnboarding).toHaveBeenCalledWith('user-123');
    });
  });

  describe('resetOnboarding', () => {
    it('should reset onboarding progress', async () => {
      mockOnboardingService.resetOnboarding.mockResolvedValue(undefined);

      const result = await controller.resetOnboarding({ user: mockUser });

      expect(result).toEqual({ message: 'Onboarding reset successfully' });
      expect(service.resetOnboarding).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getOnboardingAnalytics', () => {
    it('should return onboarding analytics', async () => {
      const expectedAnalytics = {
        totalUsers: 100,
        distribution: {
          notStarted: 20,
          inProgress: 30,
          completed: 40,
          skipped: 10,
        },
        completionRate: 40,
        averageCompletionTime: 2.5,
      };

      mockOnboardingService.getOnboardingAnalytics.mockResolvedValue(
        expectedAnalytics
      );

      const result = await controller.getOnboardingAnalytics();

      expect(result).toEqual(expectedAnalytics);
      expect(service.getOnboardingAnalytics).toHaveBeenCalled();
    });
  });
});
