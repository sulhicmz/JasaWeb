import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { EmailService } from '../common/services/email.service';
import { OnboardingAnalyticsService } from './onboarding-analytics.service';
import { CreateOnboardingStateDto } from './dto/create-onboarding-state.dto';
import { UpdateOnboardingStateDto } from './dto/update-onboarding-state.dto';
import { CompleteStepDto } from './dto/complete-step.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private analyticsService: OnboardingAnalyticsService
  ) {}

  async getOnboardingState(userId: string, organizationId: string) {
    // First, verify that the user belongs to the organization
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of this organization');
    }

    const state = await this.prisma.onboardingState.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!state) {
      return await this.createOnboardingState(userId, organizationId);
    }

    // Ensure the onboarding state is for the correct organization
    if (state.organizationId !== organizationId) {
      throw new BadRequestException('Onboarding state does not belong to this organization');
    }

    return state;
  }

    return state;
  }

  async createOnboardingState(userId: string, organizationId: string) {
    // Check if user exists and has access to organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'User is not a member of this organization'
      );
    }

    // Create onboarding state
    const onboardingState = await this.prisma.onboardingState.create({
      data: {
        userId,
        organizationId,
        currentStep: 'welcome',
        completedSteps: [],
        isCompleted: false,
        skippedSteps: [],
        preferences: {},
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Send welcome email
    await this.sendWelcomeEmail(onboardingState);

    // Track onboarding started
    await this.analyticsService.trackOnboardingStarted(userId, organizationId);

    return onboardingState;
  }

  async updateOnboardingState(
    userId: string,
    updateOnboardingStateDto: UpdateOnboardingStateDto
  ) {
    const { currentStep, completedSteps, skippedSteps, preferences } =
      updateOnboardingStateDto;

    const existingState = await this.prisma.onboardingState.findUnique({
      where: { userId },
    });

    if (!existingState) {
      throw new NotFoundException('Onboarding state not found');
    }

    // Verify that the user is authorized to update this onboarding state
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId: existingState.organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException('User is not authorized to update this onboarding state');
    }

    const updatedState = await this.prisma.onboardingState.update({
      where: { userId },
      data: {
        currentStep: currentStep || existingState.currentStep,
        completedSteps: completedSteps || existingState.completedSteps,
        skippedSteps: skippedSteps || existingState.skippedSteps,
        preferences: (preferences || existingState.preferences) as any,
        isCompleted: this.checkIfOnboardingCompleted(
          completedSteps || existingState.completedSteps,
          skippedSteps || existingState.skippedSteps
        ),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return updatedState;
  }

  async completeStep(userId: string, completeStepDto: CompleteStepDto) {
    const { stepKey, data } = completeStepDto;

    const existingState = await this.prisma.onboardingState.findUnique({
      where: { userId },
    });

    if (!existingState) {
      throw new NotFoundException('Onboarding state not found');
    }

    // Verify that the user is authorized to update this onboarding state
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId: existingState.organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException('User is not authorized to update this onboarding state');
    }

    // Get step from database instead of hardcoded list
    const step = await this.prisma.onboardingStep.findUnique({
      where: { stepKey },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    // Check dependencies from database
    const stepDependencies = step.dependsOn || [];

    for (const dependency of stepDependencies) {
      if (!existingState.completedSteps.includes(dependency)) {
        throw new BadRequestException(
          `Step ${dependency} must be completed first`
        );
      }
    }

    // Track step started if not already completed
    const isNewStep = !existingState.completedSteps.includes(stepKey);
    if (isNewStep) {
      await this.analyticsService.trackStepStarted(
        userId,
        existingState.organizationId,
        stepKey
      );
    }

    // Add step to completed steps if not already there
    const completedSteps = existingState.completedSteps.includes(stepKey)
      ? existingState.completedSteps
      : [...existingState.completedSteps, stepKey];

    // Get next step from database
    const nextStep = await this.getNextStep(
      completedSteps,
      existingState.skippedSteps
    );

    const isCompleted = this.checkIfOnboardingCompleted(
      completedSteps,
      existingState.skippedSteps
    );

    const updatedState = await this.prisma.onboardingState.update({
      where: { userId },
      data: {
        completedSteps,
        currentStep: isCompleted ? 'complete' : nextStep,
        isCompleted,
        preferences: {
          ...((existingState.preferences as any) || {}),
          [stepKey]: data || {},
        } as any,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Track step completion
    if (isNewStep) {
      await this.analyticsService.trackStepCompleted(
        userId,
        existingState.organizationId,
        stepKey
      );
    }

    // Track onboarding completion
    if (isCompleted && !existingState.isCompleted) {
      // Calculate total time (simplified - in production you'd store start timestamp)
      const totalTimeSpent = 10 * 60 * 1000; // 10 minutes in milliseconds
      await this.analyticsService.trackOnboardingCompleted(
        userId,
        existingState.organizationId,
        totalTimeSpent
      );
    }

    // Send progress or completion email
    if (isCompleted) {
      await this.sendCompletionEmail(updatedState);
    } else if (completedSteps.length % 2 === 0) {
      // Send progress email every 2 steps
      await this.sendProgressEmail(updatedState, completedSteps);
    }

    return updatedState;
  }

  async skipStep(userId: string, stepKey: string) {
    const existingState = await this.prisma.onboardingState.findUnique({
      where: { userId },
    });

    if (!existingState) {
      throw new NotFoundException('Onboarding state not found');
    }

    // Verify that the user is authorized to update this onboarding state
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId: existingState.organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException('User is not authorized to update this onboarding state');
    }

    // Get step from database
    const step = await this.prisma.onboardingStep.findUnique({
      where: { stepKey },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    if (step.isRequired) {
      throw new BadRequestException('Required steps cannot be skipped');
    }

    const skippedSteps = existingState.skippedSteps.includes(stepKey)
      ? existingState.skippedSteps
      : [...existingState.skippedSteps, stepKey];

    // Get next step from database
    const nextStep = await this.getNextStep(
      existingState.completedSteps,
      skippedSteps
    );

    // Track step skipped
    await this.analyticsService.trackStepSkipped(
      userId,
      existingState.organizationId,
      stepKey
    );

    const updatedState = await this.prisma.onboardingState.update({
      where: { userId },
      data: {
        skippedSteps,
        currentStep: nextStep,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return updatedState;
  }

  async getAllSteps() {
    return await this.prisma.onboardingStep.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async getStep(stepKey: string) {
    const step = await this.prisma.onboardingStep.findUnique({
      where: { stepKey },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    return step;
  }

  private async getNextStep(
    completedSteps: string[],
    skippedSteps: string[]
  ): Promise<string> {
    // Get all available steps from database
    const allSteps = await this.prisma.onboardingStep.findMany({
      orderBy: { order: 'asc' },
    });

    for (const step of allSteps) {
      if (
        !completedSteps.includes(step.stepKey) &&
        !skippedSteps.includes(step.stepKey)
      ) {
        return step.stepKey;
      }
    }

    return 'complete';
  }

  private checkIfOnboardingCompleted(
    completedSteps: string[],
    skippedSteps: string[]
  ): boolean {
    // Get required steps from database
    const requiredStepsResult = await this.prisma.onboardingStep.findMany({
      where: { isRequired: true },
      select: { stepKey: true },
    });

    const requiredSteps = requiredStepsResult.map((step) => step.stepKey);

    return requiredSteps.every(
      (step) => completedSteps.includes(step) || skippedSteps.includes(step)
    );
  }

  private async sendWelcomeEmail(onboardingState: any) {
    try {
      await this.emailService.sendEmail({
        to: onboardingState.user.email,
        subject: 'Start Your Journey with JasaWeb',
        template: './onboarding-welcome',
        context: {
          name: onboardingState.user.name || onboardingState.user.email,
          organizationName: onboardingState.organization.name,
          onboardingUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/onboarding`,
          supportUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/support`,
        },
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error to avoid blocking onboarding
    }
  }

  private async sendProgressEmail(
    onboardingState: any,
    completedSteps: string[]
  ) {
    try {
      // Get required steps from database for progress calculation
      const allStepsResult = await this.prisma.onboardingStep.findMany({
        orderBy: { order: 'asc' },
      });
      const requiredSteps = allStepsResult.filter((step) => step.isRequired);

      const progressPercentage = Math.round(
        (completedSteps.length / requiredSteps.length) * 100
      );

      await this.emailService.sendEmail({
        to: onboardingState.user.email,
        subject: 'Great Progress on Your JasaWeb Onboarding!',
        template: './onboarding-progress',
        context: {
          name: onboardingState.user.name || onboardingState.user.email,
          progressPercentage,
          completedSteps: completedSteps.length,
          totalSteps: requiredSteps.length,
          onboardingUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/onboarding`,
          helpCenterUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/help`,
          videoTutorialsUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/tutorials`,
          encouragementMessage:
            this.getEncouragementMessage(progressPercentage),
        },
      });
    } catch (error) {
      console.error('Failed to send progress email:', error);
    }
  }

  private async sendCompletionEmail(onboardingState: any) {
    try {
      await this.emailService.sendEmail({
        to: onboardingState.user.email,
        subject: 'Congratulations! Your JasaWeb Onboarding is Complete',
        template: './onboarding-complete',
        context: {
          name: onboardingState.user.name || onboardingState.user.email,
          organizationName: onboardingState.organization.name,
          dashboardUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/portal`,
          newProjectUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/portal/projects/new`,
          helpCenterUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/help`,
          supportUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/support`,
          scheduleCallUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/schedule-call`,
          onboardingStats: {
            stepsCompleted: onboardingState.completedSteps.length,
            timeSpent: '10 minutes', // This could be calculated from timestamps
            projectsCreated: 1, // This could be calculated from actual data
          },
        },
      });
    } catch (error) {
      console.error('Failed to send completion email:', error);
    }
  }

  private getEncouragementMessage(progressPercentage: number): string {
    if (progressPercentage >= 75) {
      return "You're almost there! Just a few more steps to unlock the full power of JasaWeb.";
    } else if (progressPercentage >= 50) {
      return "Fantastic progress! You're halfway through the onboarding process.";
    } else if (progressPercentage >= 25) {
      return "Great start! You're building a solid foundation for your projects.";
    } else {
      return "You're on your way! Every step brings you closer to streamlined project management.";
    }
  }
}
