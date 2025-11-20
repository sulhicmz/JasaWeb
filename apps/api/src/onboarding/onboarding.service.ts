import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OnboardingStatus } from '../users/entities/user.entity';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: string;
  required: boolean;
  order: number;
}

export interface OnboardingProgress {
  userId: string;
  status: OnboardingStatus;
  currentStep: number;
  completedSteps: string[];
  totalSteps: number;
  progressPercentage: number;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  // Define onboarding steps
  private readonly onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to JasaWeb',
      description: 'Get started with an overview of your client portal',
      required: true,
      order: 0,
    },
    {
      id: 'profile_setup',
      title: 'Complete Your Profile',
      description: 'Add your profile information and preferences',
      required: true,
      order: 1,
    },
    {
      id: 'dashboard_tour',
      title: 'Dashboard Tour',
      description: 'Learn about your dashboard and key features',
      required: true,
      order: 2,
    },
    {
      id: 'project_overview',
      title: 'Project Management',
      description: 'Understand how to track and manage your projects',
      required: true,
      order: 3,
    },
    {
      id: 'approval_workflow',
      title: 'Approval Process',
      description: 'Learn how to review and approve project items',
      required: true,
      order: 4,
    },
    {
      id: 'file_management',
      title: 'File Management',
      description: 'Upload and manage project files',
      required: false,
      order: 5,
    },
    {
      id: 'support_tickets',
      title: 'Support & Tickets',
      description: 'Get help and track support requests',
      required: false,
      order: 6,
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Get onboarding steps configuration
   */
  getOnboardingSteps(): OnboardingStep[] {
    return this.onboardingSteps;
  }

  /**
   * Get user's onboarding progress
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStatus: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        onboardingPreferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const completedSteps = this.getCompletedSteps(user.onboardingPreferences);
    const totalSteps = this.onboardingSteps.filter(
      (step) => step.required
    ).length;
    const progressPercentage = Math.round(
      (completedSteps.length / totalSteps) * 100
    );

    return {
      userId,
      status: user.onboardingStatus as OnboardingStatus,
      currentStep: user.onboardingStep,
      completedSteps,
      totalSteps,
      progressPercentage,
    };
  }

  /**
   * Start onboarding for a user
   */
  async startOnboarding(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
        onboardingStep: 0,
        onboardingPreferences: {
          startedAt: new Date().toISOString(),
          completedSteps: [],
        },
      },
    });

    this.logger.log(`Onboarding started for user: ${userId}`);
  }

  /**
   * Update onboarding step progress
   */
  async updateOnboardingStep(
    userId: string,
    stepId: string,
    completed: boolean = true
  ): Promise<OnboardingProgress> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingPreferences: true, onboardingStep: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const preferences = (user.onboardingPreferences as any) || {};
    const completedSteps = preferences.completedSteps || [];

    if (completed && !completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    } else if (!completed && completedSteps.includes(stepId)) {
      const index = completedSteps.indexOf(stepId);
      completedSteps.splice(index, 1);
    }

    // Find next step
    const currentStepIndex = this.onboardingSteps.findIndex(
      (step) => step.id === stepId
    );
    const nextStepIndex = currentStepIndex + 1;
    const nextStep =
      nextStepIndex < this.onboardingSteps.length
        ? this.onboardingSteps[nextStepIndex]
        : null;

    // Check if all required steps are completed
    const requiredSteps = this.onboardingSteps.filter((step) => step.required);
    const allRequiredCompleted = requiredSteps.every((step) =>
      completedSteps.includes(step.id)
    );

    const updateData: any = {
      onboardingPreferences: {
        ...preferences,
        completedSteps,
        lastUpdated: new Date().toISOString(),
      },
    };

    if (nextStep) {
      updateData.onboardingStep = nextStep.order;
    }

    if (allRequiredCompleted) {
      updateData.onboardingStatus = OnboardingStatus.COMPLETED;
      updateData.onboardingCompletedAt = new Date();
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    this.logger.log(
      `Onboarding step ${stepId} ${completed ? 'completed' : 'uncompleted'} for user: ${userId}`
    );

    return this.getOnboardingProgress(userId);
  }

  /**
   * Skip onboarding
   */
  async skipOnboarding(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: OnboardingStatus.SKIPPED,
        onboardingPreferences: {
          skippedAt: new Date().toISOString(),
          reason: 'user_skipped',
        },
      },
    });

    this.logger.log(`Onboarding skipped for user: ${userId}`);
  }

  /**
   * Reset onboarding progress
   */
  async resetOnboarding(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: OnboardingStatus.NOT_STARTED,
        onboardingStep: 0,
        onboardingCompletedAt: null,
        onboardingPreferences: null,
      },
    });

    this.logger.log(`Onboarding reset for user: ${userId}`);
  }

  /**
   * Get onboarding analytics
   */
  async getOnboardingAnalytics(): Promise<any> {
    const users = await this.prisma.user.findMany({
      select: {
        onboardingStatus: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        createdAt: true,
      },
    });

    const totalUsers = users.length;
    const notStarted = users.filter(
      (u) => u.onboardingStatus === OnboardingStatus.NOT_STARTED
    ).length;
    const inProgress = users.filter(
      (u) => u.onboardingStatus === OnboardingStatus.IN_PROGRESS
    ).length;
    const completed = users.filter(
      (u) => u.onboardingStatus === OnboardingStatus.COMPLETED
    ).length;
    const skipped = users.filter(
      (u) => u.onboardingStatus === OnboardingStatus.SKIPPED
    ).length;

    // Calculate average completion time
    const completedUsers = users.filter((u) => u.onboardingCompletedAt);
    const avgCompletionTime =
      completedUsers.length > 0
        ? completedUsers.reduce((acc, user) => {
            const completionTime =
              user.onboardingCompletedAt!.getTime() - user.createdAt.getTime();
            return acc + completionTime;
          }, 0) /
          completedUsers.length /
          (1000 * 60 * 60) // Convert to hours
        : 0;

    return {
      totalUsers,
      distribution: {
        notStarted,
        inProgress,
        completed,
        skipped,
      },
      completionRate: totalUsers > 0 ? (completed / totalUsers) * 100 : 0,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Helper method to extract completed steps from preferences
   */
  private getCompletedSteps(preferences: any): string[] {
    if (!preferences || typeof preferences !== 'object') {
      return [];
    }
    return preferences.completedSteps || [];
  }
}
