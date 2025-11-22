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
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingStateDto } from './dto/create-onboarding-state.dto';
import { UpdateOnboardingStateDto } from './dto/update-onboarding-state.dto';
import { CompleteStepDto } from './dto/complete-step.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';

@Controller('onboarding')
@UseGuards(RolesGuard, MultiTenantGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('state')
  async getOnboardingState(@Req() req: any) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    // Security: Ensure user can only access their own onboarding state
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('Access denied: You can only access your own onboarding state');
    }

    return await this.onboardingService.getOnboardingState(
      userId,
      organizationId
    );
  }

  @Post('state')
  async createOnboardingState(
    @Body() createOnboardingStateDto: CreateOnboardingStateDto
  ) {
    return await this.onboardingService.createOnboardingState(
      createOnboardingStateDto.userId,
      createOnboardingStateDto.organizationId
    );
  }

  @Put('state')
  async updateOnboardingState(
    @Req() req: any,
    @Body() updateOnboardingStateDto: UpdateOnboardingStateDto
  ) {
    const userId = req.user.userId;

    // Security: Ensure user can only update their own onboarding state
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('Access denied: You can only update your own onboarding state');
    }

    return await this.onboardingService.updateOnboardingState(
      userId,
      updateOnboardingStateDto
    );
  }

  @Post('complete-step')
  async completeStep(
    @Req() req: any,
    @Body() completeStepDto: CompleteStepDto
  ) {
    const userId = req.user.userId;

    // Security: Ensure user can only complete their own onboarding steps
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('Access denied: You can only complete your own onboarding steps');
    }

    return await this.onboardingService.completeStep(userId, completeStepDto);
  }

  @Post('skip-step/:stepKey')
  async skipStep(@Req() req: any, @Param('stepKey') stepKey: string) {
    const userId = req.user.userId;

    // Security: Ensure user can only skip their own onboarding steps
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('Access denied: You can only skip your own onboarding steps');
    }

    return await this.onboardingService.skipStep(userId, stepKey);
  }

  @Get('steps')
  async getAllSteps() {
    return await this.onboardingService.getAllSteps();
  }

  @Get('steps/:stepKey')
  async getStep(@Param('stepKey') stepKey: string) {
    return await this.onboardingService.getStep(stepKey);
  }
}