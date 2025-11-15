import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Start onboarding process' })
  @ApiResponse({ status: 200, description: 'Onboarding started successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async startOnboarding(@Request() req: any) {
    return this.onboardingService.startOnboarding(
      req.user.id,
      req.user.organizationId
    );
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Complete onboarding process' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
  })
  async completeOnboarding(
    @Request() req: any,
    @Body() completeOnboardingDto: any
  ) {
    return this.onboardingService.completeOnboarding(
      req.user.id,
      req.user.organizationId,
      completeOnboardingDto
    );
  }

  @Post('progress')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update onboarding progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  async updateProgress(
    @Request() req: any,
    @Body() progressDto: { step: string; data: any }
  ) {
    return this.onboardingService.updateProgress(
      req.user.id,
      req.user.organizationId,
      progressDto.step,
      progressDto.data
    );
  }

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status retrieved successfully',
  })
  async getOnboardingStatus(@Request() req: any) {
    return this.onboardingService.getOnboardingStatus(
      req.user.id,
      req.user.organizationId
    );
  }

  @Post('organization')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update organization during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  async updateOrganization(@Request() req: any, @Body() organizationDto: any) {
    return this.onboardingService.updateOrganization(
      req.user.id,
      req.user.organizationId,
      organizationDto
    );
  }

  @Post('invite-team')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Invite team members during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Team invitations sent successfully',
  })
  async inviteTeam(
    @Request() req: any,
    @Body() inviteDto: { members: Array<{ email: string; role: string }> }
  ) {
    return this.onboardingService.inviteTeamMembers(
      req.user.id,
      req.user.organizationId,
      inviteDto.members
    );
  }

  @Post('create-project')
  @HttpCode(HttpStatus.CREATED)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Create first project during onboarding' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async createFirstProject(@Request() req: any, @Body() projectDto: any) {
    return this.onboardingService.createFirstProject(
      req.user.id,
      req.user.organizationId,
      projectDto
    );
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available project templates' })
  @ApiResponse({
    status: 200,
    description: 'Project templates retrieved successfully',
  })
  async getProjectTemplates() {
    return this.onboardingService.getProjectTemplates();
  }

  @Post('template/:templateId')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get details for a specific template' })
  @ApiResponse({
    status: 200,
    description: 'Template details retrieved successfully',
  })
  async getTemplateDetails(@Body('templateId') templateId: string) {
    return this.onboardingService.getTemplateDetails(templateId);
  }

  @Post('achievements')
  @HttpCode(HttpStatus.OK)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Unlock achievement during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Achievement unlocked successfully',
  })
  async unlockAchievement(
    @Request() req: any,
    @Body() achievementDto: { achievementId: string }
  ) {
    return this.onboardingService.unlockAchievement(
      req.user.id,
      req.user.organizationId,
      achievementDto.achievementId
    );
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({
    status: 200,
    description: 'Achievements retrieved successfully',
  })
  async getUserAchievements(@Request() req: any) {
    return this.onboardingService.getUserAchievements(
      req.user.id,
      req.user.organizationId
    );
  }
}
