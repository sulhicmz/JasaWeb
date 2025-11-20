import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService, OnboardingProgress } from './onboarding.service';

export class UpdateOnboardingStepDto {
  stepId: string;
  completed: boolean;
}

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * Get available onboarding steps
   */
  @Get('steps')
  async getOnboardingSteps() {
    return this.onboardingService.getOnboardingSteps();
  }

  /**
   * Get user's onboarding progress
   */
  @Get('progress')
  async getOnboardingProgress(@Request() req): Promise<OnboardingProgress> {
    return this.onboardingService.getOnboardingProgress(req.user.userId);
  }

  /**
   * Start onboarding for the current user
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startOnboarding(@Request() req) {
    await this.onboardingService.startOnboarding(req.user.userId);
    return { message: 'Onboarding started successfully' };
  }

  /**
   * Update onboarding step progress
   */
  @Put('step')
  async updateOnboardingStep(
    @Request() req,
    @Body() updateStepDto: UpdateOnboardingStepDto
  ): Promise<OnboardingProgress> {
    return this.onboardingService.updateOnboardingStep(
      req.user.userId,
      updateStepDto.stepId,
      updateStepDto.completed
    );
  }

  /**
   * Skip onboarding
   */
  @Post('skip')
  @HttpCode(HttpStatus.OK)
  async skipOnboarding(@Request() req) {
    await this.onboardingService.skipOnboarding(req.user.userId);
    return { message: 'Onboarding skipped' };
  }

  /**
   * Reset onboarding progress
   */
  @Delete('reset')
  async resetOnboarding(@Request() req) {
    await this.onboardingService.resetOnboarding(req.user.userId);
    return { message: 'Onboarding reset successfully' };
  }

  /**
   * Get onboarding analytics (admin only)
   */
  @Get('analytics')
  async getOnboardingAnalytics() {
    return this.onboardingService.getOnboardingAnalytics();
  }
}
