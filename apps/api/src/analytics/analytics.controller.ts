import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';

@UseGuards(AuthGuard, MultiTenantGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService
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

  @Get('projects/:projectId/metrics')
  async getProjectMetrics(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentOrganizationId() organizationId: string,
    @Query('status') status?: string[],
    @Query('priority') priority?: string[],
    @Query('assigneeId') assigneeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const filters = {
      status,
      priority,
      assigneeId,
      dateRange:
        dateFrom && dateTo
          ? {
              start: new Date(dateFrom),
              end: new Date(dateTo),
            }
          : undefined,
    };

    return this.analyticsService.getProjectMetrics(
      projectId,
      organizationId,
      filters
    );
  }

  @Get('organization/overview')
  async getOrganizationAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('status') status?: string[],
    @Query('priority') priority?: string[],
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const filters = {
      status,
      priority,
      dateRange:
        dateFrom && dateTo
          ? {
              start: new Date(dateFrom),
              end: new Date(dateTo),
            }
          : undefined,
    };

    return this.analyticsService.getOrganizationAnalytics(
      organizationId,
      filters
    );
  }

  @Get('projects/:projectId/predictions')
  async getPredictiveAnalytics(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.analyticsService.getPredictiveAnalytics(
      projectId,
      organizationId
    );
  }

  @Get('projects/:projectId/predictions/timeline')
  async getTimelinePrediction(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.predictiveAnalyticsService.predictTimeline(
      projectId,
      organizationId
    );
  }

  @Get('projects/:projectId/predictions/budget')
  async getBudgetPrediction(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.predictiveAnalyticsService.predictBudget(
      projectId,
      organizationId
    );
  }

  @Get('projects/:projectId/predictions/quality')
  async getQualityPrediction(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.predictiveAnalyticsService.predictQuality(
      projectId,
      organizationId
    );
  }

  @Get('projects/:projectId/predictions/risk')
  async getRiskPrediction(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.predictiveAnalyticsService.predictRisk(
      projectId,
      organizationId
    );
  }

  @Post('models/train')
  async trainModels(@CurrentOrganizationId() organizationId: string) {
    return this.predictiveAnalyticsService.trainModels(organizationId);
  }

  @Get('models/status')
  async getModelStatus() {
    return this.predictiveAnalyticsService.getModelStatus();
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
}
