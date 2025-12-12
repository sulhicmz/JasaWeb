import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Body,
  Param,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

@UseGuards(AuthGuard, MultiTenantGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
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

  @Get('summary')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getAnalyticsSummary(
    @CurrentOrganizationId() organizationId: string,
    @Query('timePeriod') timePeriod: string = '30'
  ) {
    const cacheKey = `analytics-summary-${organizationId}-${timePeriod}`;

    let summary = await this.cacheManager.get(cacheKey);
    if (!summary) {
      summary = await this.analyticsService.getAnalyticsSummary(
        organizationId,
        timePeriod
      );
      await this.cacheManager.set(cacheKey, summary, 300000); // Cache for 5 minutes
    }

    return summary;
  }

  @Get('projects/:projectId/activity')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getProjectActivity(
    @Param('projectId') projectId: string,
    @CurrentOrganizationId() organizationId: string,
    @Query('limit') limit: string = '20'
  ) {
    return this.analyticsService.getProjectActivity(
      projectId,
      organizationId,
      parseInt(limit)
    );
  }

  @Post('export')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async exportAnalytics(
    @Body()
    body: { format: string; timePeriod: string; includeProjects: boolean },
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    return this.analyticsService.exportAnalytics({
      ...body,
      organizationId,
      requestedBy: userId,
    });
  }

  @Get('realtime-metrics')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getRealtimeMetrics(@CurrentOrganizationId() organizationId: string) {
    return this.analyticsService.getRealtimeMetrics(organizationId);
  }

  @Post('reports/schedule')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async scheduleReport(
    @Body()
    scheduleData: {
      name: string;
      frequency: string;
      recipients: string[];
      formats: string[];
      filters?: any;
    },
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    return this.analyticsService.scheduleReport({
      ...scheduleData,
      organizationId,
      createdBy: userId,
    });
  }

  @Get('reports/scheduled')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async getScheduledReports(@CurrentOrganizationId() organizationId: string) {
    return this.analyticsService.getScheduledReports(organizationId);
  }

  @Delete('reports/scheduled/:reportId')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async deleteScheduledReport(
    @Param('reportId') reportId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.analyticsService.deleteScheduledReport(
      reportId,
      organizationId
    );
  }
}
