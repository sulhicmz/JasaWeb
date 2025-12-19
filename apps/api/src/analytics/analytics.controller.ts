import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@UseGuards(AuthGuard, MultiTenantGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('projects')
  async getProjectAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getProjectAnalytics(organizationId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      projectId: query.projectId,
    });
  }

  @Get('team-performance')
  async getTeamPerformanceAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getTeamPerformanceAnalytics(organizationId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      userId: query.userId,
    });
  }

  @Get('financial')
  async getFinancialAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getFinancialAnalytics(organizationId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      projectId: query.projectId,
    });
  }

  @Get('client-insights')
  async getClientInsightsAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getClientInsightsAnalytics(organizationId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }

  @Get('activity-trends')
  async getActivityTrends(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getActivityTrends(organizationId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity: query.groupBy as 'day' | 'week' | 'month' | undefined,
    });
  }

  @Get('overview')
  async getOverviewAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    const [projects, teamPerformance, financial, clientInsights] =
      await Promise.all([
        this.analyticsService.getProjectAnalytics(organizationId, {
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        }),
        this.analyticsService.getTeamPerformanceAnalytics(organizationId, {
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        }),
        this.analyticsService.getFinancialAnalytics(organizationId, {
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        }),
        this.analyticsService.getClientInsightsAnalytics(organizationId, {
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
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
