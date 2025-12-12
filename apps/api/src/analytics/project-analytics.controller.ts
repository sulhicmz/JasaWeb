import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ProjectAnalyticsService,
  ProjectAnalyticsDto,
} from './project-analytics.service';
import {
  BudgetAnalyticsService,
  BudgetAnalyticsDto,
} from './budget-analytics.service';
import {
  HealthRecommendationService,
  HealthRecommendationDto,
} from './health-recommendation.service';

@ApiTags('Project Analytics')
@Controller('analytics/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectAnalyticsController {
  constructor(
    private readonly projectAnalyticsService: ProjectAnalyticsService,
    private readonly budgetAnalyticsService: BudgetAnalyticsService,
    private readonly healthRecommendationService: HealthRecommendationService
  ) {}

  @Get()
  @Roles('owner', 'admin', 'reviewer')
  @ApiOperation({ summary: 'Get comprehensive project analytics' })
  @ApiResponse({
    status: 200,
    description: 'Project analytics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectAnalytics(
    @Query('projectId') projectId: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const analyticsDto: ProjectAnalyticsDto = {
      projectId,
      organizationId,
      timeRange,
    };

    return this.projectAnalyticsService.getProjectAnalytics(analyticsDto);
  }

  @Get('health-score')
  @Roles('owner', 'admin', 'reviewer')
  @ApiOperation({ summary: 'Get project health score' })
  @ApiResponse({
    status: 200,
    description: 'Health score retrieved successfully',
  })
  async getProjectHealthScore(
    @Query('projectId') projectId: string,
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const analyticsDto: ProjectAnalyticsDto = {
      projectId,
      organizationId,
      timeRange: '30d',
    };

    const analytics =
      await this.projectAnalyticsService.getProjectAnalytics(analyticsDto);
    return {
      projectId,
      healthScore: analytics.metrics.healthScore,
      riskLevel: analytics.metrics.riskLevel,
      lastUpdated: analytics.metrics.lastUpdated,
    };
  }

  @Get('forecast')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get project completion forecast' })
  @ApiResponse({ status: 200, description: 'Forecast retrieved successfully' })
  async getProjectForecast(
    @Query('projectId') projectId: string,
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const analyticsDto: ProjectAnalyticsDto = {
      projectId,
      organizationId,
      timeRange: '30d',
    };

    const analytics =
      await this.projectAnalyticsService.getProjectAnalytics(analyticsDto);
    return {
      projectId,
      forecast: analytics.forecast,
      recommendations: analytics.recommendations,
    };
  }

  @Get('team-productivity')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get team productivity metrics' })
  @ApiResponse({
    status: 200,
    description: 'Team productivity retrieved successfully',
  })
  async getTeamProductivity(
    @Query('projectId') projectId: string,
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const analyticsDto: ProjectAnalyticsDto = {
      projectId,
      organizationId,
      timeRange: '30d',
    };

    const analytics =
      await this.projectAnalyticsService.getProjectAnalytics(analyticsDto);
    return {
      projectId,
      teamProductivity: analytics.teamProductivity,
      overallProductivity: analytics.metrics.teamProductivity,
    };
  }

  @Get('trends')
  @Roles('owner', 'admin', 'reviewer')
  @ApiOperation({ summary: 'Get project performance trends' })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  async getProjectTrends(
    @Query('projectId') projectId: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const analyticsDto: ProjectAnalyticsDto = {
      projectId,
      organizationId,
      timeRange,
    };

    const analytics =
      await this.projectAnalyticsService.getProjectAnalytics(analyticsDto);
    return {
      projectId,
      timeRange,
      trends: analytics.trends,
    };
  }

  @Get('budget')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get project budget analytics' })
  @ApiResponse({
    status: 200,
    description: 'Budget analytics retrieved successfully',
  })
  async getBudgetAnalytics(
    @Query('projectId') projectId: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const budgetDto: BudgetAnalyticsDto = {
      projectId,
      organizationId,
      timeRange,
    };

    return this.budgetAnalyticsService.getBudgetAnalytics(budgetDto);
  }

  @Get('budget/health')
  @Roles('owner', 'admin', 'reviewer')
  @ApiOperation({ summary: 'Get project budget health status' })
  @ApiResponse({
    status: 200,
    description: 'Budget health retrieved successfully',
  })
  async getBudgetHealth(
    @Query('projectId') projectId: string,
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const budgetDto: BudgetAnalyticsDto = {
      projectId,
      organizationId,
      timeRange: '30d',
    };

    const analytics =
      await this.budgetAnalyticsService.getBudgetAnalytics(budgetDto);
    return {
      projectId,
      budgetHealth: analytics.metrics.budgetHealth,
      budgetUtilization: analytics.metrics.budgetUtilization,
      remainingBudget: analytics.metrics.remainingBudget,
      projectedOverrun: analytics.forecast.expectedOverrun,
      lastUpdated: new Date(),
    };
  }

  @Get('health-recommendations')
  @Roles('owner', 'admin', 'reviewer')
  @ApiOperation({ summary: 'Get automated health recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Health recommendations retrieved successfully',
  })
  async getHealthRecommendations(
    @Query('projectId') projectId: string,
    @Request() req: any
  ) {
    const organizationId = req.user.organizationId;

    const healthDto: HealthRecommendationDto = {
      projectId,
      organizationId,
    };

    return this.healthRecommendationService.generateHealthRecommendations(
      healthDto
    );
  }
}
