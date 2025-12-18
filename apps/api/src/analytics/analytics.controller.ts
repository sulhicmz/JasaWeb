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
}
