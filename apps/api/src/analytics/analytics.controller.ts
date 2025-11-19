import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Analytics')
@UseGuards(AuthGuard, MultiTenantGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('projects')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get project analytics',
    description:
      'Retrieves analytics data for projects within the organization',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date for analytics period',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date for analytics period',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Specific project ID to analyze',
    example: 'proj_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Project analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalProjects: { type: 'number', example: 25 },
        activeProjects: { type: 'number', example: 18 },
        completedProjects: { type: 'number', example: 7 },
        averageProjectDuration: { type: 'number', example: 45 },
        projectsByStatus: {
          type: 'object',
          properties: {
            active: { type: 'number', example: 18 },
            completed: { type: 'number', example: 7 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
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
