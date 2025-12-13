import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Body,
  InternalServerErrorException,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { DashboardGateway } from './dashboard.gateway';

interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    highPriority: number;
    critical: number;
  };
  invoices: {
    total: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    pendingAmount: number;
  };
  milestones: {
    total: number;
    completed: number;
    overdue: number;
    dueThisWeek: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'project' | 'ticket' | 'milestone' | 'invoice';
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  priority?: string;
  dueDate?: Date;
}

@Controller('dashboard')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dashboardGateway: DashboardGateway
  ) {}

  @Get('stats')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getDashboardStats(
    @CurrentOrganizationId() organizationId: string,
    @Query('refresh') refresh?: string
  ): Promise<DashboardStats> {
    const cacheKey = `dashboard-stats-${organizationId}`;

    // Return cached data if available and not forcing refresh
    if (!refresh || refresh !== 'true') {
      const cachedStats = await this.cacheManager.get<DashboardStats>(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }
    }

    // Execute all queries in parallel for better performance
    const [projectsStats, ticketsStats, invoicesStats, milestonesStats] =
      await Promise.all([
        this.getProjectsStats(organizationId),
        this.getTicketsStats(organizationId),
        this.getInvoicesStats(organizationId),
        this.getMilestonesStats(organizationId),
      ]);

    const stats: DashboardStats = {
      projects: projectsStats,
      tickets: ticketsStats,
      invoices: invoicesStats,
      milestones: milestonesStats,
    };

    // Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, stats, 300000);

    return stats;
  }

  @Get('recent-activity')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getRecentActivity(
    @CurrentOrganizationId() organizationId: string,
    @Query('limit') limit: string = '10'
  ): Promise<RecentActivity[]> {
    const limitNum = Math.min(parseInt(limit) || 10, 50); // Cap at 50 items

    const [recentProjects, recentTickets, recentMilestones, recentInvoices] =
      await Promise.all([
        this.getRecentProjects(organizationId, Math.ceil(limitNum / 4)),
        this.getRecentTickets(organizationId, Math.ceil(limitNum / 4)),
        this.getRecentMilestones(organizationId, Math.ceil(limitNum / 4)),
        this.getRecentInvoices(organizationId, Math.ceil(limitNum / 4)),
      ]);

    // Combine and sort by date
    const allActivities = [
      ...recentProjects,
      ...recentTickets,
      ...recentMilestones,
      ...recentInvoices,
    ];

    return allActivities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limitNum);
  }

  @Get('projects-overview')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getProjectsOverview(
    @CurrentOrganizationId() organizationId: string,
    @Query('limit') limit: string = '6',
    @Query('include') include: string = 'basic'
  ) {
    const limitNum = Math.min(parseInt(limit) || 6, 20);
    const includeDetails = include === 'details';

    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: includeDetails
          ? {
              include: {
                assignees: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }
          : {
              select: {
                id: true,
                status: true,
                dueAt: true,
                title: true,
                progress: true,
              },
            },
        tickets: includeDetails
          ? {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }
          : {
              select: {
                id: true,
                status: true,
                priority: true,
              },
            },
        _count: {
          select: {
            milestones: true,
            tickets: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limitNum,
    });

    // Calculate progress and additional metrics for each project
    const projectsWithMetrics = projects.map((project: any) => {
      const totalMilestones = project.milestones?.length || 0;
      const completedMilestones =
        project.milestones?.filter((m: any) => m.status === 'completed')
          .length || 0;
      const progress =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      const openTickets =
        project.tickets?.filter(
          (t: any) => t.status === 'open' || t.status === 'in-progress'
        ).length || 0;

      const highPriorityTickets =
        (project as any).tickets?.filter(
          (t: any) =>
            (t.priority === 'high' || t.priority === 'critical') &&
            (t.status === 'open' || t.status === 'in-progress')
        ).length || 0;

      return {
        id: project.id,
        name: project.name,
        description: null, // Project model doesn't have description field
        status: project.status,
        progress,
        totalMilestones,
        completedMilestones,
        openTickets,
        highPriorityTickets,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        startAt: project.startAt,
        dueAt: project.dueAt,
      };
    });

    return projectsWithMetrics;
  }

  private async getProjectsStats(organizationId: string) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      select: { status: true },
    });

    const total = projects.length;
    const active = projects.filter(
      (p) => p.status === 'active' || p.status === 'in-progress'
    ).length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const onHold = projects.filter((p) => p.status === 'on-hold').length;

    return { total, active, completed, onHold };
  }

  private async getTicketsStats(organizationId: string) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: { organizationId },
      select: { status: true, priority: true },
    });

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in-progress').length;
    const highPriority = tickets.filter(
      (t) =>
        (t.priority === 'high' || t.priority === 'critical') &&
        (t.status === 'open' || t.status === 'in-progress')
    ).length;
    const critical = tickets.filter(
      (t) =>
        t.priority === 'critical' &&
        (t.status === 'open' || t.status === 'in-progress')
    ).length;

    return { total, open, inProgress, highPriority, critical };
  }

  private async getInvoicesStats(organizationId: string) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
      select: { status: true, amount: true, dueAt: true },
    });

    const total = invoices.length;
    const pending = invoices.filter(
      (i) => i.status === 'draft' || i.status === 'issued'
    ).length;
    const overdue = invoices.filter(
      (i) =>
        (i.status === 'issued' || i.status === 'overdue') &&
        new Date(i.dueAt) < new Date()
    ).length;

    const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingAmount = invoices
      .filter((i) => i.status === 'draft' || i.status === 'issued')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    return { total, pending, overdue, totalAmount, pendingAmount };
  }

  private async getMilestonesStats(organizationId: string) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
      },
      select: { status: true, dueAt: true },
    });

    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const overdue = milestones.filter(
      (m) => m.status !== 'completed' && m.dueAt && new Date(m.dueAt) < now
    ).length;
    const dueThisWeek = milestones.filter(
      (m) =>
        m.status !== 'completed' &&
        m.dueAt &&
        new Date(m.dueAt) >= now &&
        new Date(m.dueAt) <= weekFromNow
    ).length;

    return { total, completed, overdue, dueThisWeek };
  }

  private async getRecentProjects(
    organizationId: string,
    limit: number
  ): Promise<RecentActivity[]> {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return projects.map((project) => ({
      id: project.id,
      type: 'project' as const,
      title: project.name,
      description: 'No description', // Project model doesn't have description field
      status: project.status,
      createdAt: project.updatedAt,
    }));
  }

  private async getRecentTickets(
    organizationId: string,
    limit: number
  ): Promise<RecentActivity[]> {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: { organizationId },
      select: {
        id: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return tickets.map((ticket) => ({
      id: ticket.id,
      type: 'ticket' as const,
      title: `${ticket.type} ticket`,
      description: `Priority: ${ticket.priority}`,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    }));
  }

  private async getRecentMilestones(
    organizationId: string,
    limit: number
  ): Promise<RecentActivity[]> {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: { organizationId },
      select: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return milestones.map((milestone) => ({
      id: milestone.id,
      type: 'milestone' as const,
      title: milestone.title,
      description: 'Milestone',
      status: milestone.status,
      createdAt: milestone.createdAt,
      dueDate: milestone.dueAt || undefined,
    }));
  }

  private async getRecentInvoices(
    organizationId: string,
    limit: number
  ): Promise<RecentActivity[]> {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        amount: true,
        dueAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      type: 'invoice' as const,
      title: `Invoice ${invoice.id.slice(-8)}`, // Use last 8 chars of ID as invoice number
      description: 'Invoice',
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueAt,
    }));
  }

  @Post('notify-update')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async notifyDashboardUpdate(
    @Body() body: { type: string; data: any },
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    try {
      await this.dashboardGateway.broadcastDashboardUpdate({
        type: body.type as
          | 'stats'
          | 'activity'
          | 'project'
          | 'ticket'
          | 'milestone'
          | 'invoice',
        data: { ...body.data, userId },
        timestamp: new Date(),
        organizationId,
      });

      return { success: true, message: 'Update notification sent' };
    } catch (error) {
      throw new Error(
        `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Post('refresh-cache')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async refreshDashboardCache(@CurrentOrganizationId() organizationId: string) {
    try {
      // Clear all dashboard-related cache keys for this organization
      await Promise.all([
        this.cacheManager.del(`dashboard-stats-${organizationId}`),
        this.cacheManager.del(`dashboard-activity-${organizationId}`),
        this.cacheManager.del(`dashboard-projects-${organizationId}`),
      ]);

      // Broadcast refresh event to all connected clients
      await this.dashboardGateway.broadcastDashboardUpdate({
        type: 'stats',
        data: { action: 'refresh' },
        timestamp: new Date(),
        organizationId,
      });

      return { success: true, message: 'Cache refreshed and clients notified' };
    } catch (error) {
      throw new Error(
        `Failed to refresh cache: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Get('analytics/trends')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getAnalyticsTrends(
    @CurrentOrganizationId() organizationId: string,
    @Query('period') period: string = '30d',
    @Query('metrics') metrics?: string
  ) {
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const selectedMetrics = metrics
      ? metrics.split(',')
      : ['projects', 'tickets', 'milestones', 'invoices'];

    try {
      const trends = await Promise.all(
        selectedMetrics.map((metric) =>
          this.getMetricTrends(organizationId, metric, startDate)
        )
      );

      return {
        period,
        startDate,
        endDate: new Date(),
        trends: trends.reduce(
          (acc, trend, index) => {
            const metric = selectedMetrics[index];
            if (metric) {
              acc[metric] = trend;
            }
            return acc;
          },
          {} as Record<string, any>
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get analytics trends: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Get('analytics/performance')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getPerformanceMetrics(
    @CurrentOrganizationId() organizationId: string,
    @Query('period') period: string = '90d'
  ) {
    const days = parseInt(period) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const [
        projectPerformance,
        ticketResolution,
        milestoneCompletion,
        invoiceMetrics,
      ] = await Promise.all([
        this.getProjectPerformanceMetrics(organizationId, startDate),
        this.getTicketResolutionMetrics(organizationId, startDate),
        this.getMilestoneCompletionMetrics(organizationId, startDate),
        this.getInvoiceMetrics(organizationId, startDate),
      ]);

      return {
        period,
        startDate,
        endDate: new Date(),
        projectPerformance,
        ticketResolution,
        milestoneCompletion,
        invoiceMetrics,
      };
    } catch (error) {
      throw new Error(
        `Failed to get performance metrics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Get('analytics/forecast')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async getForecastAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('horizon') horizon: string = '30d'
  ) {
    const days = parseInt(horizon) || 30;
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + days);

    try {
      const [
        projectForecast,
        milestoneForecast,
        invoiceForecast,
        resourceForecast,
      ] = await Promise.all([
        this.getProjectForecast(organizationId, forecastDate),
        this.getMilestoneForecast(organizationId, forecastDate),
        this.getInvoiceForecast(organizationId, forecastDate),
        this.getResourceForecast(organizationId, forecastDate),
      ]);

      return {
        horizon,
        forecastDate,
        currentDate: new Date(),
        projectForecast,
        milestoneForecast,
        invoiceForecast,
        resourceForecast,
      };
    } catch (error) {
      throw new Error(
        `Failed to get forecast analytics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getMetricTrends(
    organizationId: string,
    metric: string,
    startDate: Date
  ) {
    const endDate = new Date();

    switch (metric) {
      case 'projects':
        return this.getProjectTrends(organizationId, startDate, endDate);
      case 'tickets':
        return this.getTicketTrends(organizationId, startDate, endDate);
      case 'milestones':
        return this.getMilestoneTrends(organizationId, startDate, endDate);
      case 'invoices':
        return this.getInvoiceTrends(organizationId, startDate, endDate);
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  }

  private async getProjectTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        status: true,
        startAt: true,
        dueAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day and calculate cumulative metrics
    const dailyData = this.groupByDay(
      projects,
      'createdAt',
      startDate,
      endDate
    );

    return {
      total: projects.length,
      daily: dailyData,
      completionRate:
        (projects.filter((p) => p.status === 'completed').length /
          projects.length) *
        100,
      averageDuration: this.calculateAverageProjectDuration(projects),
    };
  }

  private async getTicketTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        status: true,
        priority: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyData = this.groupByDay(tickets, 'createdAt', startDate, endDate);

    return {
      total: tickets.length,
      daily: dailyData,
      resolutionRate:
        (tickets.filter((t) => t.status === 'closed').length / tickets.length) *
        100,
      highPriorityRate:
        (tickets.filter(
          (t) => t.priority === 'high' || t.priority === 'critical'
        ).length /
          tickets.length) *
        100,
    };
  }

  private async getMilestoneTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        status: true,
        dueAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyData = this.groupByDay(
      milestones,
      'createdAt',
      startDate,
      endDate
    );

    return {
      total: milestones.length,
      daily: dailyData,
      completionRate:
        (milestones.filter((m) => m.status === 'completed').length /
          milestones.length) *
        100,
      onTimeDeliveryRate: this.calculateOnTimeDeliveryRate(milestones),
    };
  }

  private async getInvoiceTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        status: true,
        amount: true,
        dueAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyData = this.groupByDay(
      invoices,
      'createdAt',
      startDate,
      endDate
    );

    return {
      total: invoices.length,
      daily: dailyData,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      paidRate:
        (invoices.filter((inv) => inv.status === 'paid').length /
          invoices.length) *
        100,
    };
  }

  private async getProjectPerformanceMetrics(
    organizationId: string,
    startDate: Date
  ) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      include: {
        milestones: {
          select: { status: true, dueAt: true, completedAt: true },
        },
        tickets: {
          select: {
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { milestones: true, tickets: true },
        },
      },
    });

    return {
      totalProjects: projects.length,
      averageMilestonesPerProject:
        projects.reduce(
          (sum, p) => sum + ((p as any)._count?.milestones || 0),
          0
        ) / projects.length,
      averageTicketsPerProject:
        projects.reduce(
          (sum, p) => sum + ((p as any)._count?.tickets || 0),
          0
        ) / projects.length,
      onTimeCompletionRate: this.calculateOnTimeCompletionRate(projects),
      budgetAdherence: this.calculateBudgetAdherence(projects),
    };
  }

  private async getTicketResolutionMetrics(
    organizationId: string,
    startDate: Date
  ) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const resolvedTickets = tickets.filter((t) => t.status === 'closed');

    return {
      totalTickets: tickets.length,
      resolvedTickets: resolvedTickets.length,
      averageResolutionTime:
        this.calculateAverageResolutionTime(resolvedTickets),
      resolutionRateByPriority: this.calculateResolutionRateByPriority(tickets),
      slaComplianceRate: this.calculateSLAComplianceRate(tickets),
    };
  }

  private async getMilestoneCompletionMetrics(
    organizationId: string,
    startDate: Date
  ) {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        dueAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.status === 'completed')
        .length,
      averageCompletionTime:
        this.calculateAverageMilestoneCompletionTime(milestones),
      overdueRate:
        (milestones.filter(
          (m) =>
            m.status !== 'completed' &&
            m.dueAt &&
            new Date(m.dueAt) < new Date()
        ).length /
          milestones.length) *
        100,
    };
  }

  private async getInvoiceMetrics(organizationId: string, startDate: Date) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        amount: true,
        dueAt: true,
        createdAt: true,
        paidAt: true,
      },
    });

    return {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      paidAmount: invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
      averagePaymentTime: this.calculateAveragePaymentTime(invoices),
      overdueRate:
        (invoices.filter(
          (inv) =>
            (inv.status === 'issued' || inv.status === 'overdue') &&
            inv.dueAt &&
            new Date(inv.dueAt) < new Date()
        ).length /
          invoices.length) *
        100,
    };
  }

  private async getProjectForecast(organizationId: string, forecastDate: Date) {
    const activeProjects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        status: { in: ['active', 'in-progress'] },
      },
      include: {
        milestones: {
          select: { status: true, dueAt: true },
        },
      },
    });

    const upcomingMilestones = activeProjects.flatMap(
      (p) =>
        (p as any).milestones?.filter(
          (m: any) =>
            m.status !== 'completed' &&
            m.dueAt &&
            new Date(m.dueAt) <= forecastDate
        ) || []
    );

    return {
      activeProjects: activeProjects.length,
      projectsCompletingSoon: activeProjects.filter(
        (p) => p.dueAt && new Date(p.dueAt) <= forecastDate
      ).length,
      upcomingMilestones: upcomingMilestones.length,
      riskLevel: this.calculateProjectRiskLevel(
        activeProjects,
        upcomingMilestones
      ),
    };
  }

  private async getMilestoneForecast(
    organizationId: string,
    forecastDate: Date
  ) {
    const pendingMilestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        status: { not: 'completed' },
        dueAt: { lte: forecastDate },
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
        project: {
          select: { name: true, status: true },
        },
      },
    });

    return {
      pendingMilestones: pendingMilestones.length,
      overdueMilestones: pendingMilestones.filter(
        (m) => m.dueAt && new Date(m.dueAt) < new Date()
      ).length,
      dueThisWeek: pendingMilestones.filter((m) => {
        if (!m.dueAt) return false;
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return new Date(m.dueAt) <= weekFromNow;
      }).length,
      milestones: pendingMilestones,
    };
  }

  private async getInvoiceForecast(organizationId: string, forecastDate: Date) {
    const pendingInvoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['draft', 'issued'] },
        dueAt: { lte: forecastDate },
      },
      select: {
        id: true,
        amount: true,
        dueAt: true,
        status: true,
      },
    });

    return {
      pendingInvoices: pendingInvoices.length,
      totalPendingAmount: pendingInvoices.reduce(
        (sum, inv) => sum + (inv.amount || 0),
        0
      ),
      overdueAmount: pendingInvoices
        .filter((inv) => inv.dueAt && new Date(inv.dueAt) < new Date())
        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
      dueThisMonth: pendingInvoices
        .filter((inv) => {
          if (!inv.dueAt) return false;
          const monthFromNow = new Date();
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          return new Date(inv.dueAt) <= monthFromNow;
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
    };
  }

  private async getResourceForecast(
    organizationId: string,
    forecastDate: Date
  ) {
    // This is a simplified resource forecast based on project workload
    const activeProjects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        status: { in: ['active', 'in-progress'] },
      },
      include: {
        milestones: {
          where: {
            status: { not: 'completed' },
            dueAt: { lte: forecastDate },
          },
        },
        tickets: {
          where: {
            status: { in: ['open', 'in-progress'] },
          },
        },
      },
    });

    const totalWorkload = activeProjects.reduce((sum, project) => {
      return (
        sum +
        ((project as any).milestones?.length || 0) * 10 +
        ((project as any).tickets?.length || 0) * 3
      ); // Simplified workload calculation
    }, 0);

    return {
      activeProjects: activeProjects.length,
      totalWorkload,
      averageWorkloadPerProject: totalWorkload / activeProjects.length,
      resourceUtilization: Math.min(
        (totalWorkload / (activeProjects.length * 40)) * 100,
        100
      ), // Assuming 40 hours per project per week
      recommendation: this.getResourceRecommendation(
        totalWorkload,
        activeProjects.length
      ),
    };
  }

  // Helper methods for calculations
  private groupByDay(
    items: any[],
    dateField: string,
    startDate: Date,
    endDate: Date
  ) {
    const dailyData: Record<string, number> = {};
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      if (dateKey) {
        dailyData[dateKey] = 0;
      }
      current.setDate(current.getDate() + 1);
    }

    items.forEach((item) => {
      const date = new Date(item[dateField]);
      const dateKey = date.toISOString().split('T')[0];
      if (dateKey && dailyData.hasOwnProperty(dateKey)) {
        dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
      }
    });

    return Object.entries(dailyData).map(([date, count]) => ({ date, count }));
  }

  private calculateAverageProjectDuration(projects: any[]) {
    const completedProjects = projects.filter(
      (p) => p.status === 'completed' && p.startAt && p.dueAt
    );
    if (completedProjects.length === 0) return 0;

    const totalDays = completedProjects.reduce((sum, project) => {
      const start = project.startAt ? new Date(project.startAt) : new Date();
      const end = project.dueAt ? new Date(project.dueAt) : new Date();
      return (
        sum +
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
    }, 0);

    return Math.round(totalDays / completedProjects.length);
  }

  private calculateOnTimeDeliveryRate(milestones: any[]) {
    const completedMilestones = milestones.filter(
      (m) => m.status === 'completed' && m.dueAt
    );
    if (completedMilestones.length === 0) return 0;

    const onTime = completedMilestones.filter((m) => {
      const completedAt = m.completedAt ? new Date(m.completedAt) : new Date();
      const dueDate = new Date(m.dueAt);
      return completedAt <= dueDate;
    });

    return Math.round((onTime.length / completedMilestones.length) * 100);
  }

  private calculateOnTimeCompletionRate(projects: any[]) {
    const completedProjects = projects.filter(
      (p) => p.status === 'completed' && p.dueAt
    );
    if (completedProjects.length === 0) return 0;

    const onTime = completedProjects.filter((p) => {
      // Assuming updatedAt represents completion date for completed projects
      const completedAt = p.updatedAt ? new Date(p.updatedAt) : new Date();
      const dueDate = new Date(p.dueAt);
      return completedAt <= dueDate;
    });

    return Math.round((onTime.length / completedProjects.length) * 100);
  }

  private calculateBudgetAdherence(projects: any[]) {
    // Simplified budget adherence calculation
    // In a real implementation, this would compare actual vs. budgeted costs
    return 85; // Placeholder value
  }

  private calculateAverageResolutionTime(tickets: any[]) {
    if (tickets.length === 0) return 0;

    const totalHours = tickets.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt);
      const resolved = ticket.updatedAt
        ? new Date(ticket.updatedAt)
        : new Date();
      return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    }, 0);

    return Math.round(totalHours / tickets.length);
  }

  private calculateResolutionRateByPriority(tickets: any[]) {
    const priorities = ['low', 'medium', 'high', 'critical'];
    return priorities.reduce(
      (acc, priority) => {
        const priorityTickets = tickets.filter((t) => t.priority === priority);
        const resolved = priorityTickets.filter((t) => t.status === 'closed');
        acc[priority] =
          priorityTickets.length > 0
            ? Math.round((resolved.length / priorityTickets.length) * 100)
            : 0;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private calculateSLAComplianceRate(tickets: any[]) {
    // Simplified SLA calculation (24 hours for high/critical, 48 hours for medium, 72 hours for low)
    const slaHours = { critical: 24, high: 24, medium: 48, low: 72 };

    const resolvedTickets = tickets.filter((t) => t.status === 'closed');
    if (resolvedTickets.length === 0) return 0;

    const compliant = resolvedTickets.filter((ticket) => {
      const sla = slaHours[ticket.priority as keyof typeof slaHours] || 48;
      const created = new Date(ticket.createdAt);
      const resolved = ticket.updatedAt
        ? new Date(ticket.updatedAt)
        : new Date();
      const hoursToResolve =
        (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
      return hoursToResolve <= sla;
    });

    return Math.round((compliant.length / resolvedTickets.length) * 100);
  }

  private calculateAverageMilestoneCompletionTime(milestones: any[]) {
    const completedMilestones = milestones.filter(
      (m) => m.status === 'completed' && m.createdAt
    );
    if (completedMilestones.length === 0) return 0;

    const totalDays = completedMilestones.reduce((sum, milestone) => {
      const created = new Date(milestone.createdAt);
      const completed = milestone.completedAt
        ? new Date(milestone.completedAt)
        : new Date();
      return (
        sum +
        Math.ceil(
          (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    }, 0);

    return Math.round(totalDays / completedMilestones.length);
  }

  private calculateAveragePaymentTime(invoices: any[]) {
    const paidInvoices = invoices.filter(
      (inv) => inv.status === 'paid' && inv.createdAt && inv.paidAt
    );
    if (paidInvoices.length === 0) return 0;

    const totalDays = paidInvoices.reduce((sum, invoice) => {
      const created = new Date(invoice.createdAt);
      const paid = new Date(invoice.paidAt);
      return (
        sum +
        Math.ceil((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      );
    }, 0);

    return Math.round(totalDays / paidInvoices.length);
  }

  private calculateProjectRiskLevel(
    projects: any[],
    upcomingMilestones: any[]
  ) {
    const overdueMilestones = upcomingMilestones.filter(
      (m) => m.dueAt && new Date(m.dueAt) < new Date()
    ).length;

    const highRiskProjects = projects.filter(
      (p) =>
        p.dueAt &&
        new Date(p.dueAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length;

    if (overdueMilestones > 5 || highRiskProjects > 2) return 'high';
    if (overdueMilestones > 2 || highRiskProjects > 0) return 'medium';
    return 'low';
  }

  private getResourceRecommendation(workload: number, projects: number) {
    const avgWorkload = workload / projects;
    if (avgWorkload > 50) return 'high-priority-hiring-needed';
    if (avgWorkload > 35) return 'consider-resource-allocation';
    if (avgWorkload < 15) return 'underutilized-capacity';
    return 'optimal-resource-utilization';
  }

  @Get('projects/enhanced')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getEnhancedProjects(
    @CurrentOrganizationId() organizationId: string,
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('risk') riskLevel?: string
  ) {
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // Build where clause
    const whereClause: any = { organizationId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const projects = await this.multiTenantPrisma.project.findMany({
      where: whereClause,
      include: {
        milestones: {
          include: {
            assignees: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { dueAt: 'asc' },
        },
        tickets: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { priority: 'desc' },
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
            dueAt: true,
            currency: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limitNum,
    });

    // Enhance projects with additional metrics
    const enhancedProjects = await Promise.all(
      projects.map(async (project) => {
        const projectWithMetrics =
          await this.enhanceProjectWithMetrics(project);

        // Apply risk level filter if specified
        if (riskLevel && riskLevel !== 'all') {
          if (projectWithMetrics.riskLevel !== riskLevel) {
            return null;
          }
        }

        return projectWithMetrics;
      })
    );

    // Filter out null values (from risk level filtering)
    return enhancedProjects.filter(
      (project): project is NonNullable<typeof project> => project !== null
    );
  }

  private async enhanceProjectWithMetrics(project: any): Promise<any> {
    // Calculate health score
    const healthScore = this.calculateProjectHealthScore(project);

    // Determine risk level
    const riskLevel = this.determineProjectRiskLevel(project, healthScore);

    // Calculate budget metrics
    const budgetMetrics = await this.calculateProjectBudgetMetrics(project.id);

    // Get team information
    const teamInfo = await this.getProjectTeamInfo(project.id);

    // Calculate predicted completion date
    const predictedCompletion = this.predictProjectCompletion(project);

    return {
      ...project,
      healthScore,
      riskLevel,
      budget: budgetMetrics,
      team: teamInfo,
      predictedCompletion,
      performanceMetrics: {
        onTimeDeliveryRate: this.calculateOnTimeDeliveryRate([project]),
        budgetUtilization:
          budgetMetrics.allocated > 0
            ? (budgetMetrics.spent / budgetMetrics.allocated) * 100
            : 0,
        teamEfficiency: this.calculateTeamEfficiency(teamInfo),
        milestoneVelocity: this.calculateMilestoneVelocity(
          project.milestones || []
        ),
      },
    };
  }

  private calculateProjectHealthScore(project: any): number {
    let score = 100;

    // Progress factors
    const totalMilestones = project.milestones?.length || 0;
    const completedMilestones =
      project.milestones?.filter((m: any) => m.status === 'completed').length ||
      0;
    const progress =
      totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    if (progress < 25) score -= 20;
    else if (progress < 50) score -= 10;
    else if (progress > 90) score += 10;

    // Ticket factors
    const highPriorityTickets =
      project.tickets?.filter(
        (t: any) =>
          (t.priority === 'high' || t.priority === 'critical') &&
          (t.status === 'open' || t.status === 'in-progress')
      ).length || 0;

    if (highPriorityTickets > 3) score -= 15;
    else if (highPriorityTickets > 0) score -= 5;

    // Timeline factors
    if (project.dueAt && new Date(project.dueAt) < new Date()) {
      score -= 25;
    }

    // Milestone completion rate
    const milestoneRate =
      totalMilestones > 0 ? completedMilestones / totalMilestones : 0;
    if (milestoneRate < 0.5) score -= 15;
    else if (milestoneRate > 0.8) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private determineProjectRiskLevel(
    project: any,
    healthScore: number
  ): 'low' | 'medium' | 'high' {
    if (healthScore >= 80) return 'low';
    if (healthScore >= 60) return 'medium';
    return 'high';
  }

  private async calculateProjectBudgetMetrics(projectId: string) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { projectId },
      select: { amount: true, status: true, currency: true },
    });

    const allocated = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const spent = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    return {
      allocated,
      spent,
      currency: 'IDR', // Default currency, should be configurable
    };
  }

  private async getProjectTeamInfo(projectId: string) {
    // Get unique team members from milestones and tickets
    // For now, return empty team array as the schema doesn't include assignees
    // This would need to be implemented when the schema is updated
    const allMembers: any[] = [];

    const uniqueMembers = allMembers.filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
    );

    return uniqueMembers.map((member) => ({
      ...member,
      role: 'Team Member', // This could be enhanced with actual roles
      workload: Math.floor(Math.random() * 100), // Placeholder
      availability:
        Math.random() > 0.3
          ? 'available'
          : Math.random() > 0.5
            ? 'busy'
            : 'unavailable',
    }));
  }

  private predictProjectCompletion(project: any): Date {
    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter(
      (m: any) => m.status === 'completed'
    );
    const pendingMilestones = milestones.filter(
      (m: any) => m.status !== 'completed'
    );

    if (pendingMilestones.length === 0) {
      return new Date();
    }

    // Calculate average completion time from completed milestones
    const avgCompletionTime =
      completedMilestones.length > 0
        ? this.calculateAverageMilestoneCompletionTime(completedMilestones)
        : 7; // Default to 7 days per milestone

    // Predict completion based on remaining milestones
    const daysRemaining = pendingMilestones.length * avgCompletionTime;
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysRemaining);

    return predictedDate;
  }

  private calculateTeamEfficiency(team: any[]): number {
    if (team.length === 0) return 0;

    const availableMembers = team.filter(
      (m) => m.availability === 'available'
    ).length;
    const avgWorkload =
      team.reduce((sum, m) => sum + m.workload, 0) / team.length;

    // Efficiency based on availability and workload balance
    const availabilityScore = (availableMembers / team.length) * 100;
    const workloadScore = Math.max(0, 100 - avgWorkload);

    return Math.round((availabilityScore + workloadScore) / 2);
  }

  private calculateMilestoneVelocity(milestones: any[]): number {
    const completedMilestones = milestones.filter(
      (m) => m.status === 'completed'
    );
    if (completedMilestones.length === 0) return 0;

    const totalTime = completedMilestones.reduce((sum, milestone) => {
      if (milestone.createdAt && milestone.completedAt) {
        const days = Math.ceil(
          (new Date(milestone.completedAt).getTime() -
            new Date(milestone.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum + 7; // Default 7 days
    }, 0);

    return Math.round(totalTime / completedMilestones.length);
  }

  @Get('status-reports')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getStatusReports(
    @CurrentOrganizationId() organizationId: string,
    @Query('period') period: string = 'weekly',
    @Query('limit') limit: string = '10'
  ) {
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // In a real implementation, these would be stored in a database
    // For now, we'll generate mock reports based on current projects
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: true,
        tickets: true,
        invoices: true,
      },
      take: limitNum,
    });

    const reports = await Promise.all(
      projects.map((project) => this.generateStatusReport(project, period))
    );

    return reports.filter((report) => report !== null);
  }

  @Post('status-reports/generate')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async generateStatusReportEndpoint(
    @Body() body: { period?: string; projectId?: string },
    @CurrentOrganizationId() organizationId: string
  ) {
    const period = body.period || 'weekly';

    if (body.projectId) {
      const projects = await this.multiTenantPrisma.project.findMany({
        where: { id: body.projectId, organizationId },
        include: {
          milestones: true,
          tickets: true,
          invoices: true,
        },
      });

      if (projects.length === 0) {
        throw new Error('Project not found');
      }

      const report = await this.generateStatusReport(projects[0], period);
      return report;
    } else {
      // Generate reports for all active projects
      const projects = await this.multiTenantPrisma.project.findMany({
        where: { organizationId, status: 'active' },
        include: {
          milestones: true,
          tickets: true,
          invoices: true,
        },
      });

      const reports = await Promise.all(
        projects.map((project) => this.generateStatusReport(project, period))
      );

      return reports.filter((report) => report !== null);
    }
  }

  @Post('status-reports/generate-all')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async generateAllStatusReports(
    @CurrentOrganizationId() organizationId: string
  ) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: true,
        tickets: true,
        invoices: true,
      },
    });

    const reports = await Promise.all(
      projects.map((project) => this.generateStatusReport(project, 'weekly'))
    );

    return { success: true, generated: reports.length };
  }

  private async generateStatusReport(
    project: any,
    period: string
  ): Promise<any> {
    try {
      const progressMetrics = await this.calculateProgressMetrics(project);
      const keyAchievements = await this.identifyKeyAchievements(project);
      const blockersAndRisks = await this.identifyBlockersAndRisks(project);
      const upcomingMilestones = await this.getUpcomingMilestones(project);
      const teamPerformance = await this.calculateTeamPerformance(project);
      const recommendations = await this.generateRecommendations(
        project,
        progressMetrics,
        blockersAndRisks
      );
      const nextSteps = await this.generateNextSteps(
        project,
        upcomingMilestones
      );

      const overallStatus = this.determineOverallStatus(
        progressMetrics,
        blockersAndRisks
      );

      return {
        id: `report-${project.id}-${Date.now()}`,
        projectId: project.id,
        projectName: project.name,
        generatedAt: new Date(),
        period,
        overallStatus,
        progressMetrics,
        keyAchievements,
        blockersAndRisks,
        upcomingMilestones,
        teamPerformance,
        recommendations,
        nextSteps,
      };
    } catch (error) {
      console.error('Error generating status report:', error);
      return null;
    }
  }

  private async calculateProgressMetrics(project: any) {
    const milestones = project.milestones || [];
    const tickets = project.tickets || [];
    const invoices = project.invoices || [];

    // Overall Progress
    const completedMilestones = milestones.filter(
      (m: any) => m.status === 'completed'
    ).length;
    const overallProgress =
      milestones.length > 0
        ? (completedMilestones / milestones.length) * 100
        : 0;

    // Milestone Progress
    const milestoneProgress = overallProgress;

    // Budget Utilization
    const totalBudget = invoices.reduce(
      (sum: number, inv: any) => sum + (inv.amount || 0),
      0
    );
    const spentBudget = invoices
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const budgetUtilization =
      totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

    // Timeline Adherence
    const now = new Date();
    const overdueMilestones = milestones.filter(
      (m: any) => m.status !== 'completed' && m.dueAt && new Date(m.dueAt) < now
    ).length;
    const timelineAdherence =
      milestones.length > 0
        ? Math.max(0, 100 - (overdueMilestones / milestones.length) * 100)
        : 100;

    // Team Performance (simplified calculation)
    const openTickets = tickets.filter(
      (t: any) => t.status === 'open' || t.status === 'in-progress'
    ).length;
    const criticalTickets = tickets.filter(
      (t: any) => t.priority === 'critical' && t.status !== 'closed'
    ).length;
    const teamPerformance = Math.max(
      0,
      100 - criticalTickets * 10 - openTickets * 2
    );

    return {
      overallProgress: Math.round(overallProgress),
      milestoneProgress: Math.round(milestoneProgress),
      budgetUtilization: Math.round(budgetUtilization),
      timelineAdherence: Math.round(timelineAdherence),
      teamPerformance: Math.round(teamPerformance),
    };
  }

  private async identifyKeyAchievements(project: any): Promise<string[]> {
    const achievements = [];
    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter(
      (m: any) => m.status === 'completed'
    );

    if (completedMilestones.length > 0) {
      achievements.push(
        `Completed ${completedMilestones.length} milestone${completedMilestones.length > 1 ? 's' : ''}`
      );
    }

    const recentMilestones = completedMilestones.filter((m: any) => {
      const completedAt = m.completedAt ? new Date(m.completedAt) : new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedAt > weekAgo;
    });

    if (recentMilestones.length > 0) {
      achievements.push(
        `${recentMilestones.length} milestone${recentMilestones.length > 1 ? 's' : ''} completed this week`
      );
    }

    const tickets = project.tickets || [];
    const resolvedTickets = tickets.filter((t: any) => t.status === 'closed');
    if (resolvedTickets.length > 0) {
      achievements.push(
        `Resolved ${resolvedTickets.length} ticket${resolvedTickets.length > 1 ? 's' : ''}`
      );
    }

    // Add project-specific achievements based on milestones
    const designMilestones = completedMilestones.filter(
      (m: any) =>
        m.title.toLowerCase().includes('design') ||
        m.title.toLowerCase().includes('ui')
    );
    if (designMilestones.length > 0) {
      achievements.push('Design phase completed successfully');
    }

    const developmentMilestones = completedMilestones.filter(
      (m: any) =>
        m.title.toLowerCase().includes('development') ||
        m.title.toLowerCase().includes('sprint')
    );
    if (developmentMilestones.length > 0) {
      achievements.push('Development milestones on track');
    }

    return achievements;
  }

  private async identifyBlockersAndRisks(project: any): Promise<any[]> {
    const blockersAndRisks = [];
    const milestones = project.milestones || [];
    const tickets = project.tickets || [];

    // Identify overdue milestones as risks
    const now = new Date();
    const overdueMilestones = milestones.filter(
      (m: any) => m.status !== 'completed' && m.dueAt && new Date(m.dueAt) < now
    );

    overdueMilestones.forEach((milestone: any) => {
      blockersAndRisks.push({
        type: 'risk',
        description: `Milestone "${milestone.title}" is overdue`,
        severity: 'high',
        dueDate: milestone.dueAt,
      });
    });

    // Identify critical tickets as blockers
    const criticalTickets = tickets.filter(
      (t: any) =>
        t.priority === 'critical' &&
        (t.status === 'open' || t.status === 'in-progress')
    );

    criticalTickets.forEach((ticket: any) => {
      blockersAndRisks.push({
        type: 'blocker',
        description: `Critical ticket: ${ticket.type || 'Issue'} needs immediate attention`,
        severity: 'critical',
      });
    });

    // Identify high priority tickets as risks
    const highPriorityTickets = tickets.filter(
      (t: any) =>
        t.priority === 'high' &&
        (t.status === 'open' || t.status === 'in-progress')
    );

    if (highPriorityTickets.length > 3) {
      blockersAndRisks.push({
        type: 'risk',
        description: `Multiple high priority tickets (${highPriorityTickets.length}) may impact timeline`,
        severity: 'medium',
      });
    }

    // Check for budget risks
    const invoices = project.invoices || [];
    const overdueInvoices = invoices.filter(
      (inv: any) =>
        (inv.status === 'issued' || inv.status === 'overdue') &&
        inv.dueAt &&
        new Date(inv.dueAt) < now
    );

    if (overdueInvoices.length > 0) {
      blockersAndRisks.push({
        type: 'risk',
        description: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} affecting cash flow`,
        severity: 'medium',
      });
    }

    return blockersAndRisks;
  }

  private async getUpcomingMilestones(project: any): Promise<any[]> {
    const milestones = project.milestones || [];
    const now = new Date();
    const monthFromNow = new Date();
    monthFromNow.setDate(monthFromNow.getDate() + 30);

    const upcomingMilestones = milestones
      .filter(
        (m: any) =>
          m.status !== 'completed' &&
          m.dueAt &&
          new Date(m.dueAt) >= now &&
          new Date(m.dueAt) <= monthFromNow
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      )
      .slice(0, 5)
      .map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        dueDate: milestone.dueAt,
        confidence: this.calculateMilestoneConfidence(milestone),
      }));

    return upcomingMilestones;
  }

  private calculateMilestoneConfidence(milestone: any): number {
    let confidence = 80; // Base confidence

    // Reduce confidence based on overdue status
    if (milestone.dueAt && new Date(milestone.dueAt) < new Date()) {
      confidence -= 30;
    }

    // Increase confidence if progress is good
    if (milestone.progress && milestone.progress > 50) {
      confidence += 10;
    }

    // Reduce confidence if no progress
    if (!milestone.progress || milestone.progress === 0) {
      confidence -= 20;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  private async calculateTeamPerformance(project: any): Promise<any> {
    const tickets = project.tickets || [];

    // Productivity: Based on ticket resolution rate
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(
      (t: any) => t.status === 'closed'
    ).length;
    const productivity =
      totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 75;

    // Collaboration: Based on milestone progress
    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter(
      (m: any) => m.status === 'completed'
    ).length;
    const collaboration =
      milestones.length > 0
        ? (completedMilestones / milestones.length) * 100
        : 75;

    // Satisfaction: Placeholder - would come from team surveys
    const satisfaction = 85;

    // Workload: Based on open tickets
    const openTickets = tickets.filter(
      (t: any) => t.status === 'open' || t.status === 'in-progress'
    ).length;
    const workload = Math.max(0, 100 - openTickets * 5);

    return {
      productivity: Math.round(productivity),
      collaboration: Math.round(collaboration),
      satisfaction: Math.round(satisfaction),
      workload: Math.round(workload),
    };
  }

  private async generateRecommendations(
    project: any,
    metrics: any,
    blockers: any[]
  ): Promise<string[]> {
    const recommendations = [];

    // Progress-based recommendations
    if (metrics.overallProgress < 50) {
      recommendations.push(
        'Consider reviewing project timeline and resource allocation'
      );
    }

    if (metrics.milestoneProgress < metrics.overallProgress) {
      recommendations.push(
        'Focus on completing milestones to improve overall progress'
      );
    }

    // Budget-based recommendations
    if (metrics.budgetUtilization > 90) {
      recommendations.push(
        'Monitor budget closely - approaching allocation limit'
      );
    } else if (metrics.budgetUtilization < 50) {
      recommendations.push(
        'Budget utilization is low - ensure resources are being used effectively'
      );
    }

    // Timeline-based recommendations
    if (metrics.timelineAdherence < 70) {
      recommendations.push(
        'Address timeline delays immediately to prevent project slippage'
      );
    }

    // Team performance recommendations
    if (metrics.teamPerformance < 60) {
      recommendations.push(
        'Team performance needs attention - consider workload redistribution'
      );
    }

    // Blocker-specific recommendations
    const criticalBlockers = blockers.filter(
      (b: any) => b.severity === 'critical'
    );
    if (criticalBlockers.length > 0) {
      recommendations.push(
        'Address critical blockers immediately to prevent project failure'
      );
    }

    const highRisks = blockers.filter(
      (b: any) => b.type === 'risk' && b.severity === 'high'
    );
    if (highRisks.length > 2) {
      recommendations.push(
        'Multiple high-risk items identified - implement risk mitigation plan'
      );
    }

    // Default recommendation if everything is going well
    if (recommendations.length === 0) {
      recommendations.push(
        'Project is performing well - maintain current momentum'
      );
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private async generateNextSteps(
    project: any,
    upcomingMilestones: any[]
  ): Promise<string[]> {
    const nextSteps = [];

    // Add upcoming milestones as next steps
    upcomingMilestones.slice(0, 3).forEach((milestone: any) => {
      nextSteps.push(
        `Complete "${milestone.title}" milestone by ${this.formatDateShort(milestone.dueDate)}`
      );
    });

    // Add action items based on project status
    const tickets = project.tickets || [];
    const criticalTickets = tickets.filter(
      (t: any) => t.priority === 'critical' && t.status !== 'closed'
    );

    if (criticalTickets.length > 0) {
      nextSteps.push(
        `Resolve ${criticalTickets.length} critical ticket${criticalTickets.length > 1 ? 's' : ''}`
      );
    }

    const highPriorityTickets = tickets.filter(
      (t: any) => t.priority === 'high' && t.status !== 'closed'
    );
    if (highPriorityTickets.length > 0) {
      nextSteps.push(
        `Address ${highPriorityTickets.length} high priority ticket${highPriorityTickets.length > 1 ? 's' : ''}`
      );
    }

    // Add general next steps
    nextSteps.push('Review project progress with stakeholders');
    nextSteps.push('Update project documentation');

    return nextSteps.slice(0, 6); // Limit to 6 next steps
  }

  private determineOverallStatus(metrics: any, blockers: any[]): string {
    const criticalBlockers = blockers.filter(
      (b: any) => b.severity === 'critical'
    ).length;
    const highRisks = blockers.filter((b: any) => b.severity === 'high').length;

    if (criticalBlockers > 0) return 'critical';
    if (highRisks > 2 || metrics.timelineAdherence < 50) return 'delayed';
    if (
      highRisks > 0 ||
      metrics.timelineAdherence < 70 ||
      metrics.overallProgress < 40
    )
      return 'at-risk';
    if (metrics.overallProgress >= 90) return 'completed';
    return 'on-track';
  }

  private formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  @Get('analytics/predictive')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async getPredictiveAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('horizon') horizon: string = '90d',
    @Query('confidence') confidence: string = '0.8'
  ) {
    const days = parseInt(horizon) || 90;
    const confidenceLevel = parseFloat(confidence) || 0.8;
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + days);

    try {
      const [
        projectPredictions,
        revenuePredictions,
        riskPredictions,
        capacityPredictions,
      ] = await Promise.all([
        this.getProjectPredictions(
          organizationId,
          forecastDate,
          confidenceLevel
        ),
        this.getRevenuePredictions(
          organizationId,
          forecastDate,
          confidenceLevel
        ),
        this.getRiskPredictions(organizationId, forecastDate, confidenceLevel),
        this.getCapacityPredictions(
          organizationId,
          forecastDate,
          confidenceLevel
        ),
      ]);

      return {
        horizon,
        forecastDate,
        confidenceLevel,
        currentDate: new Date(),
        predictions: {
          projects: projectPredictions,
          revenue: revenuePredictions,
          risks: riskPredictions,
          capacity: capacityPredictions,
        },
        recommendations: this.generatePredictiveRecommendations(
          projectPredictions,
          revenuePredictions,
          riskPredictions
        ),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate predictive analytics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getProjectPredictions(
    organizationId: string,
    forecastDate: Date,
    confidenceLevel: number
  ) {
    // Historical data for the last 90 days
    const historicalStart = new Date();
    historicalStart.setDate(historicalStart.getDate() - 90);

    const [historicalProjects, activeProjects] = await Promise.all([
      this.multiTenantPrisma.project.findMany({
        where: {
          organizationId,
          createdAt: { gte: historicalStart },
        },
        select: {
          createdAt: true,
          status: true,
          startAt: true,
          dueAt: true,
          updatedAt: true,
        },
      }),
      this.multiTenantPrisma.project.findMany({
        where: {
          organizationId,
          status: { in: ['active', 'in-progress'] },
        },
        include: {
          milestones: {
            select: { status: true, dueAt: true, completedAt: true },
          },
          tickets: {
            select: { status: true, priority: true, createdAt: true },
          },
        },
      }),
    ]);

    // Calculate project completion rate
    const completedProjects = historicalProjects.filter(
      (p) => p.status === 'completed'
    );
    const completionRate =
      completedProjects.length / Math.max(historicalProjects.length, 1);

    // Calculate average project duration
    const durations = completedProjects
      .filter((p) => p.startAt && p.dueAt)
      .map((p) => {
        const start = new Date(p.startAt!);
        const end = new Date(p.dueAt!);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      });
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 30;

    // Predict project outcomes
    const predictions = activeProjects.map((project) => {
      const totalMilestones = (project as any).milestones?.length || 0;
      const completedMilestones =
        (project as any).milestones?.filter(
          (m: any) => m.status === 'completed'
        ).length || 0;
      const milestoneProgress =
        totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

      const openTickets =
        (project as any).tickets?.filter((t: any) => t.status === 'open')
          .length || 0;
      const criticalTickets =
        (project as any).tickets?.filter(
          (t: any) => t.priority === 'critical' && t.status !== 'closed'
        ).length || 0;

      // Calculate risk factors
      const scheduleRisk = this.calculateScheduleRisk(
        project,
        milestoneProgress,
        avgDuration
      );
      const resourceRisk = this.calculateResourceRisk(
        openTickets,
        criticalTickets
      );
      const complexityRisk = this.calculateComplexityRisk(
        totalMilestones,
        openTickets
      );

      // Overall risk score (0-1)
      const overallRisk =
        scheduleRisk * 0.4 + resourceRisk * 0.4 + complexityRisk * 0.2;

      // Predict completion probability
      const completionProbability =
        Math.max(0, 1 - overallRisk) * confidenceLevel;

      // Predict completion date
      const predictedCompletion = this.predictCompletionDate(
        project,
        milestoneProgress,
        avgDuration
      );

      return {
        projectId: project.id,
        projectName: project.name || 'Unknown Project',
        currentStatus: project.status,
        milestoneProgress: Math.round(milestoneProgress * 100),
        completionProbability: Math.round(completionProbability * 100),
        predictedCompletionDate: predictedCompletion,
        riskFactors: {
          schedule: Math.round(scheduleRisk * 100),
          resource: Math.round(resourceRisk * 100),
          complexity: Math.round(complexityRisk * 100),
        },
        recommendations: this.generateProjectRecommendations(
          overallRisk,
          milestoneProgress,
          criticalTickets
        ),
      };
    });

    // Overall predictions
    const avgCompletionProbability =
      predictions.reduce((sum, p) => sum + p.completionProbability, 0) /
      predictions.length;
    const highRiskProjects = predictions.filter(
      (p) => p.completionProbability < 70
    ).length;

    return {
      overallCompletionRate: Math.round(completionRate * 100),
      averageProjectDuration: Math.round(avgDuration),
      predictedCompletions: Math.round(
        (activeProjects.length * avgCompletionProbability) / 100
      ),
      highRiskProjects,
      projectsAtRisk: predictions.filter((p) => p.completionProbability < 80),
      detailedPredictions: predictions,
    };
  }

  private async getRevenuePredictions(
    organizationId: string,
    forecastDate: Date,
    confidenceLevel: number
  ) {
    // Historical revenue data
    const historicalStart = new Date();
    historicalStart.setDate(historicalStart.getDate() - 90);

    const historicalInvoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: historicalStart },
        status: 'paid',
      },
      select: {
        amount: true,
        createdAt: true,
        paidAt: true,
      },
    });

    // Current pipeline
    const pendingInvoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['draft', 'issued'] },
      },
      select: {
        amount: true,
        dueAt: true,
        status: true,
      },
    });

    // Calculate revenue trends
    const monthlyRevenue = this.calculateMonthlyRevenue(historicalInvoices);
    const revenueGrowthRate = this.calculateRevenueGrowthRate(monthlyRevenue);
    const avgMonthlyRevenue =
      monthlyRevenue.reduce((sum, rev) => sum + rev, 0) / monthlyRevenue.length;

    // Predict future revenue
    const monthsAhead = Math.ceil(
      (forecastDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );
    const predictedRevenue = this.predictRevenue(
      avgMonthlyRevenue,
      revenueGrowthRate,
      monthsAhead,
      confidenceLevel
    );

    // Calculate payment probability for pending invoices
    const pendingAmount = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const paymentProbability =
      this.calculatePaymentProbability(historicalInvoices);

    return {
      currentMonthlyAverage: Math.round(avgMonthlyRevenue),
      revenueGrowthRate: Math.round(revenueGrowthRate * 100),
      predictedRevenue: Math.round(predictedRevenue),
      pendingAmount,
      predictedCollection: Math.round(
        pendingAmount * paymentProbability * confidenceLevel
      ),
      confidenceInterval: {
        lower: Math.round(predictedRevenue * (confidenceLevel - 0.1)),
        upper: Math.round(predictedRevenue * (confidenceLevel + 0.1)),
      },
      seasonalTrends: this.identifySeasonalTrends(monthlyRevenue),
    };
  }

  private async getRiskPredictions(
    organizationId: string,
    forecastDate: Date,
    confidenceLevel: number
  ) {
    // Current risk indicators
    const [criticalTickets, overdueMilestones, overdueInvoices] =
      await Promise.all([
        this.multiTenantPrisma.ticket.count({
          where: {
            organizationId,
            priority: 'critical',
            status: { in: ['open', 'in-progress'] },
          },
        }),
        this.multiTenantPrisma.milestone.count({
          where: {
            organizationId,
            status: { not: 'completed' },
            dueAt: { lt: new Date() },
          },
        }),
        this.multiTenantPrisma.invoice.count({
          where: {
            organizationId,
            status: { in: ['issued', 'overdue'] },
            dueAt: { lt: new Date() },
          },
        }),
      ]);

    // Calculate risk scores
    const operationalRisk = this.calculateOperationalRisk(
      criticalTickets,
      overdueMilestones
    );
    const financialRisk = this.calculateFinancialRisk(overdueInvoices);
    const capacityRisk = await this.calculateCapacityRisk(organizationId);

    // Overall risk assessment
    const overallRiskScore =
      operationalRisk * 0.4 + financialRisk * 0.3 + capacityRisk * 0.3;

    // Predict risk evolution
    const riskTrend = this.predictRiskTrend(
      overallRiskScore,
      criticalTickets,
      overdueMilestones
    );

    return {
      overallRiskScore: Math.round(overallRiskScore * 100),
      riskLevel: this.getRiskLevel(overallRiskScore),
      riskCategories: {
        operational: Math.round(operationalRisk * 100),
        financial: Math.round(financialRisk * 100),
        capacity: Math.round(capacityRisk * 100),
      },
      riskTrend,
      riskFactors: {
        criticalTickets,
        overdueMilestones,
        overdueInvoices,
      },
      mitigationStrategies: this.generateMitigationStrategies(
        overallRiskScore,
        operationalRisk,
        financialRisk,
        capacityRisk
      ),
    };
  }

  private async getCapacityPredictions(
    organizationId: string,
    forecastDate: Date,
    confidenceLevel: number
  ) {
    const activeProjects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        status: { in: ['active', 'in-progress'] },
      },
      include: {
        milestones: {
          where: { status: { not: 'completed' } },
        },
        tickets: {
          where: { status: { in: ['open', 'in-progress'] } },
        },
      },
    });

    // Calculate current capacity utilization
    const totalWorkload = activeProjects.reduce((sum, project) => {
      return (
        sum +
        ((project as any).milestones?.length || 0) * 8 +
        ((project as any).tickets?.length || 0) * 2
      );
    }, 0);

    const availableCapacity = activeProjects.length * 40; // 40 hours per project per week
    const currentUtilization = Math.min(
      (totalWorkload / availableCapacity) * 100,
      100
    );

    // Predict future capacity needs
    const projectedWorkload = this.projectWorkloadGrowth(
      activeProjects,
      forecastDate
    );
    const projectedUtilization = Math.min(
      (projectedWorkload / availableCapacity) * 100,
      100
    );

    // Capacity recommendations
    const capacityBuffer = 100 - projectedUtilization;
    const canTakeNewProjects = capacityBuffer > 20;

    return {
      currentUtilization: Math.round(currentUtilization),
      projectedUtilization: Math.round(projectedUtilization),
      availableCapacity: Math.round(availableCapacity - totalWorkload),
      capacityBuffer: Math.round(capacityBuffer),
      canTakeNewProjects,
      recommendedTeamSize: Math.ceil(projectedWorkload / 35), // 35 hours per team member per week
      burnoutRisk: this.calculateBurnoutRisk(
        currentUtilization,
        projectedUtilization
      ),
      scalingRecommendations: this.generateScalingRecommendations(
        projectedUtilization,
        canTakeNewProjects
      ),
    };
  }

  // Helper methods for predictive calculations
  private calculateScheduleRisk(
    project: any,
    milestoneProgress: number,
    avgDuration: number
  ): number {
    if (!project.dueAt) return 0.3; // Medium risk if no due date

    const now = new Date();
    const dueDate = new Date(project.dueAt);
    const timeElapsed = project.startAt
      ? (now.getTime() - new Date(project.startAt).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;
    const totalTime = avgDuration;

    const expectedProgress = Math.min(timeElapsed / totalTime, 1);
    const progressDelay = Math.max(0, expectedProgress - milestoneProgress);

    return Math.min(progressDelay * 2, 1); // Scale to 0-1
  }

  private calculateResourceRisk(
    openTickets: number,
    criticalTickets: number
  ): number {
    const ticketRisk = Math.min(openTickets / 20, 1); // Risk increases with more open tickets
    const criticalRisk = Math.min(criticalTickets / 5, 1); // Critical tickets have higher impact

    return ticketRisk * 0.6 + criticalRisk * 0.4;
  }

  private calculateComplexityRisk(
    totalMilestones: number,
    openTickets: number
  ): number {
    const complexityScore = Math.min(totalMilestones / 50, 1); // More milestones = more complex
    const workloadScore = Math.min(openTickets / 15, 1);

    return complexityScore * 0.7 + workloadScore * 0.3;
  }

  private predictCompletionDate(
    project: any,
    milestoneProgress: number,
    avgDuration: number
  ): Date {
    if (milestoneProgress >= 1) {
      return new Date();
    }

    const remainingWork = 1 - milestoneProgress;
    const estimatedDaysRemaining = remainingWork * avgDuration;

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + estimatedDaysRemaining);

    return predictedDate;
  }

  private generateProjectRecommendations(
    overallRisk: number,
    milestoneProgress: number,
    criticalTickets: number
  ): string[] {
    const recommendations = [];

    if (overallRisk > 0.7) {
      recommendations.push(
        'High risk detected - immediate intervention required'
      );
    }

    if (milestoneProgress < 0.3) {
      recommendations.push('Consider reviewing project scope and timeline');
    }

    if (criticalTickets > 2) {
      recommendations.push(
        'Address critical tickets immediately to prevent delays'
      );
    }

    if (overallRisk < 0.3) {
      recommendations.push('Project progressing well - maintain current pace');
    }

    return recommendations;
  }

  private calculateMonthlyRevenue(invoices: any[]): number[] {
    const monthlyData = new Map<string, number>();

    invoices.forEach((invoice) => {
      const month = new Date(invoice.paidAt || invoice.createdAt)
        .toISOString()
        .slice(0, 7);
      monthlyData.set(
        month,
        (monthlyData.get(month) || 0) + (invoice.amount || 0)
      );
    });

    return Array.from(monthlyData.values());
  }

  private calculateRevenueGrowthRate(monthlyRevenue: number[]): number {
    if (monthlyRevenue.length < 2) return 0;

    const recent = monthlyRevenue.slice(-3);
    const earlier = monthlyRevenue.slice(-6, -3);

    if (earlier.length === 0) return 0;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    return (recentAvg - earlierAvg) / earlierAvg;
  }

  private predictRevenue(
    avgMonthlyRevenue: number,
    growthRate: number,
    months: number,
    confidenceLevel: number
  ): number {
    let totalRevenue = 0;
    let currentRevenue = avgMonthlyRevenue;

    for (let i = 0; i < months; i++) {
      totalRevenue += currentRevenue * confidenceLevel;
      currentRevenue *= 1 + growthRate;
    }

    return totalRevenue;
  }

  private calculatePaymentProbability(historicalInvoices: any[]): number {
    if (historicalInvoices.length === 0) return 0.8;

    const paidInvoices = historicalInvoices.filter(
      (inv) => inv.status === 'paid'
    );
    return paidInvoices.length / historicalInvoices.length;
  }

  private identifySeasonalTrends(monthlyRevenue: number[]): string {
    if (monthlyRevenue.length < 6) return 'Insufficient data';

    const recent = monthlyRevenue.slice(-3);
    const avg =
      monthlyRevenue.reduce((a, b) => a + b, 0) / monthlyRevenue.length;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (recentAvg > avg * 1.2) return 'Upward trend';
    if (recentAvg < avg * 0.8) return 'Downward trend';
    return 'Stable';
  }

  private calculateOperationalRisk(
    criticalTickets: number,
    overdueMilestones: number
  ): number {
    const ticketRisk = Math.min(criticalTickets / 10, 1);
    const milestoneRisk = Math.min(overdueMilestones / 15, 1);

    return ticketRisk * 0.6 + milestoneRisk * 0.4;
  }

  private calculateFinancialRisk(overdueInvoices: number): number {
    return Math.min(overdueInvoices / 20, 1);
  }

  private async calculateCapacityRisk(organizationId: string): Promise<number> {
    const activeProjects = await this.multiTenantPrisma.project.count({
      where: {
        organizationId,
        status: { in: ['active', 'in-progress'] },
      },
    });

    // Assuming optimal capacity is 10 projects per team
    return Math.min(activeProjects / 15, 1);
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore > 0.7) return 'high';
    if (riskScore > 0.4) return 'medium';
    return 'low';
  }

  private predictRiskTrend(
    currentRisk: number,
    criticalTickets: number,
    overdueMilestones: number
  ): string {
    if (criticalTickets > 5 || overdueMilestones > 8) return 'increasing';
    if (criticalTickets < 2 && overdueMilestones < 3) return 'decreasing';
    return 'stable';
  }

  private generateMitigationStrategies(
    overallRisk: number,
    operationalRisk: number,
    financialRisk: number,
    capacityRisk: number
  ): string[] {
    const strategies = [];

    if (operationalRisk > 0.6) {
      strategies.push('Implement daily stand-up meetings to address blockers');
      strategies.push('Consider reallocating resources to critical projects');
    }

    if (financialRisk > 0.6) {
      strategies.push('Strengthen invoice collection processes');
      strategies.push('Review payment terms with clients');
    }

    if (capacityRisk > 0.6) {
      strategies.push('Evaluate team workload distribution');
      strategies.push('Consider hiring additional team members');
    }

    if (overallRisk < 0.3) {
      strategies.push('Maintain current operational practices');
    }

    return strategies;
  }

  private projectWorkloadGrowth(
    activeProjects: any[],
    forecastDate: Date
  ): number {
    // Simplified workload projection based on current trends
    const daysAhead =
      (forecastDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    const weeklyGrowthRate = 0.05; // 5% growth per week

    const currentWorkload = activeProjects.reduce((sum, project) => {
      return (
        sum +
        (project.milestones?.length || 0) * 8 +
        (project.tickets?.length || 0) * 2
      );
    }, 0);

    const weeksAhead = daysAhead / 7;
    return currentWorkload * Math.pow(1 + weeklyGrowthRate, weeksAhead);
  }

  private calculateBurnoutRisk(
    currentUtilization: number,
    projectedUtilization: number
  ): string {
    if (projectedUtilization > 90) return 'high';
    if (projectedUtilization > 75) return 'medium';
    return 'low';
  }

  private generateScalingRecommendations(
    projectedUtilization: number,
    canTakeNewProjects: boolean
  ): string[] {
    const recommendations = [];

    if (projectedUtilization > 85) {
      recommendations.push('Immediate hiring recommended');
      recommendations.push('Consider outsourcing non-critical tasks');
    } else if (projectedUtilization > 70) {
      recommendations.push('Start recruitment process');
      recommendations.push('Optimize current workflows');
    }

    if (canTakeNewProjects && projectedUtilization < 60) {
      recommendations.push('Capacity available for new projects');
      recommendations.push('Focus on business development');
    }

    return recommendations;
  }

  private generatePredictiveRecommendations(
    projectPredictions: any,
    revenuePredictions: any,
    riskPredictions: any
  ): string[] {
    const recommendations = [];

    if (projectPredictions.highRiskProjects > 0) {
      recommendations.push(
        `${projectPredictions.highRiskProjects} projects require immediate attention`
      );
    }

    if (revenuePredictions.revenueGrowthRate < 0) {
      recommendations.push(
        'Revenue declining - review pricing and sales strategy'
      );
    }

    if (riskPredictions.riskLevel === 'high') {
      recommendations.push(
        'High risk level detected - implement mitigation strategies'
      );
    }

    recommendations.push(
      'Regular monitoring of predictive analytics recommended'
    );

    return recommendations;
  }
}
