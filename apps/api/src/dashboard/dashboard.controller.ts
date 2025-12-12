import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DashboardService } from './dashboard.service';
import {
  DashboardStatsQueryDto,
  RecentActivityQueryDto,
  ProjectsOverviewQueryDto,
  DashboardStatsResponseDto,
  RecentActivityDto,
  ProjectOverviewDto,
  DashboardKpiDto,
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(RolesGuard, ThrottlerGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly multiTenantPrisma: MultiTenantPrismaService
  ) {}

  @Get('stats')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  async getDashboardStats(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: DashboardStatsQueryDto
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getDashboardStats(
      organizationId,
      query.timeRange,
      query.refresh
    );
  }

  @Get('recent-activity')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
    type: [RecentActivityDto],
  })
  async getRecentActivity(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: RecentActivityQueryDto
  ): Promise<RecentActivityDto[]> {
    return this.dashboardService.getRecentActivity(
      organizationId,
      query.limit,
      query.type
    );
  }

  @Get('projects-overview')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get projects overview' })
  @ApiResponse({
    status: 200,
    description: 'Projects overview retrieved successfully',
    type: [ProjectOverviewDto],
  })
  async getProjectsOverview(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: ProjectsOverviewQueryDto
  ): Promise<ProjectOverviewDto[]> {
    return this.dashboardService.getProjectsOverview(
      organizationId,
      query.limit,
      query.status,
      query.sortBy,
      query.sortOrder
    );
  }

  @Get('kpi')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard KPIs retrieved successfully',
    type: DashboardKpiDto,
  })
  async getDashboardKpi(
    @CurrentOrganizationId() organizationId: string
  ): Promise<DashboardKpiDto> {
    return this.dashboardService.getDashboardKpi(organizationId);
  }
}
