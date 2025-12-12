import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import {
  ProjectAnalyticsService,
  ProjectMetrics,
  ProjectPerformanceInsights,
  ProjectTimelineData,
  ProjectHealthScore,
} from './project-analytics.service';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import {
  ProjectAnalyticsDto,
  ProjectMetricsDto,
  ProjectPerformanceInsightsDto,
  ProjectTimelineDataDto,
  ProjectHealthScoreDto,
  RealTimeUpdateDto,
} from './dto/analytics.dto';

@ApiTags('Project Analytics')
@Controller('analytics')
@UseGuards(AuthGuard, MultiTenantGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly projectAnalyticsService: ProjectAnalyticsService
  ) {}

  @Get('projects')
  async getProjectAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('projectId') projectId?: string
  ) {
    return this.analyticsService.getProjectAnalytics(organizationId, {
      dateFrom,
      dateTo,
      projectId,
    });
  }

  @Get('team-performance')
  async getTeamPerformanceAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('userId') userId?: string
  ) {
    return this.analyticsService.getTeamPerformanceAnalytics(organizationId, {
      dateFrom,
      dateTo,
      userId,
    });
  }

  @Get('financial')
  async getFinancialAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('projectId') projectId?: string
  ) {
    return this.analyticsService.getFinancialAnalytics(organizationId, {
      dateFrom,
      dateTo,
      projectId,
    });
  }

  @Get('client-insights')
  async getClientInsightsAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.analyticsService.getClientInsightsAnalytics(organizationId, {
      dateFrom,
      dateTo,
    });
  }

  @Get('activity-trends')
  async getActivityTrends(
    @CurrentOrganizationId() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('granularity') granularity?: 'day' | 'week' | 'month'
  ) {
    return this.analyticsService.getActivityTrends(organizationId, {
      dateFrom,
      dateTo,
      granularity,
    });
  }

  @Get('overview')
  async getOverviewAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const [projects, teamPerformance, financial, clientInsights] =
      await Promise.all([
        this.analyticsService.getProjectAnalytics(organizationId, {
          dateFrom,
          dateTo,
        }),
        this.analyticsService.getTeamPerformanceAnalytics(organizationId, {
          dateFrom,
          dateTo,
        }),
        this.analyticsService.getFinancialAnalytics(organizationId, {
          dateFrom,
          dateTo,
        }),
        this.analyticsService.getClientInsightsAnalytics(organizationId, {
          dateFrom,
          dateTo,
        }),
      ]);

    return {
      projects,
      teamPerformance,
      financial,
      clientInsights,
    };
  }

  // Enhanced Project Analytics Endpoints
  @Get('projects/metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get project metrics and KPIs' })
  @ApiResponse({
    status: 200,
    description: 'Project metrics retrieved successfully',
    type: ProjectMetricsDto,
  })
  async getProjectMetrics(
    @Request() req: any,
    @Query() analyticsDto: ProjectAnalyticsDto
  ): Promise<ProjectMetrics> {
    const organizationId = req.user.organizationId;
    return this.projectAnalyticsService.getProjectMetrics(organizationId);
  }

  @Get('projects/insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get project performance insights and recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance insights retrieved successfully',
    type: ProjectPerformanceInsightsDto,
  })
  async getProjectPerformanceInsights(
    @Request() req: any,
    @Query() analyticsDto: ProjectAnalyticsDto
  ): Promise<ProjectPerformanceInsights> {
    const organizationId = req.user.organizationId;
    return this.projectAnalyticsService.getProjectPerformanceInsights(
      organizationId
    );
  }

  @Get('projects/timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get project timeline data with milestones' })
  @ApiResponse({
    status: 200,
    description: 'Timeline data retrieved successfully',
    type: [ProjectTimelineDataDto],
  })
  async getProjectTimelineData(
    @Request() req: any,
    @Query() analyticsDto: ProjectAnalyticsDto
  ): Promise<ProjectTimelineData[]> {
    const organizationId = req.user.organizationId;
    return this.projectAnalyticsService.getProjectTimelineData(
      organizationId,
      analyticsDto.projectId
    );
  }

  @Get('projects/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get project health scores and risk assessment' })
  @ApiResponse({
    status: 200,
    description: 'Health scores retrieved successfully',
    type: [ProjectHealthScoreDto],
  })
  async getProjectHealthScores(
    @Request() req: any,
    @Query() analyticsDto: ProjectAnalyticsDto
  ): Promise<ProjectHealthScore[]> {
    const organizationId = req.user.organizationId;
    return this.projectAnalyticsService.getProjectHealthScores(organizationId);
  }

  @Get('projects/realtime')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get real-time project updates' })
  @ApiResponse({
    status: 200,
    description: 'Real-time updates retrieved successfully',
    type: RealTimeUpdateDto,
  })
  async getRealTimeProjectUpdates(
    @Request() req: any,
    @Query() analyticsDto: ProjectAnalyticsDto
  ): Promise<any> {
    const organizationId = req.user.organizationId;
    return this.projectAnalyticsService.getRealTimeProjectUpdates(
      organizationId
    );
  }

  @Get('projects/dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comprehensive project dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getProjectDashboardData(
    @Request() req: any,
    @Query() analyticsDto: ProjectAnalyticsDto
  ): Promise<any> {
    const organizationId = req.user.organizationId;

    const [metrics, insights, healthScores, realtimeUpdates] =
      await Promise.all([
        this.projectAnalyticsService.getProjectMetrics(organizationId),
        this.projectAnalyticsService.getProjectPerformanceInsights(
          organizationId
        ),
        this.projectAnalyticsService.getProjectHealthScores(organizationId),
        this.projectAnalyticsService.getRealTimeProjectUpdates(organizationId),
      ]);

    return {
      metrics,
      insights,
      healthScores,
      realtimeUpdates,
      lastUpdated: new Date(),
    };
  }
}
