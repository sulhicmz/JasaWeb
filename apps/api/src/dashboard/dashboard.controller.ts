import { Controller, Get, UseGuards, Query, Post, Body } from '@nestjs/common';
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
    @Query('limit') limit: string = '6'
  ) {
    const limitNum = Math.min(parseInt(limit) || 6, 20);

    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: {
          select: {
            id: true,
            status: true,
            dueAt: true,
          },
        },
        tickets: {
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
        project.tickets?.filter(
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
        this.cacheManager.del(`analytics-${organizationId}`),
        this.cacheManager.del(`insights-${organizationId}`),
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

  @Get('analytics')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getAdvancedAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('timeRange') timeRange: string = '30',
    @Query('refresh') refresh?: string
  ) {
    const cacheKey = `analytics-${organizationId}-${timeRange}`;

    // Return cached data if available and not forcing refresh
    if (!refresh || refresh !== 'true') {
      const cachedAnalytics = await this.cacheManager.get(cacheKey);
      if (cachedAnalytics) {
        return cachedAnalytics;
      }
    }

    const days = parseInt(timeRange) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const [
        projectTrends,
        ticketMetrics,
        invoiceAnalytics,
        milestoneAnalytics,
        teamPerformance,
        riskIndicators,
      ] = await Promise.all([
        this.getProjectTrends(organizationId, startDate),
        this.getTicketMetrics(organizationId, startDate),
        this.getInvoiceAnalytics(organizationId, startDate),
        this.getMilestoneAnalytics(organizationId, startDate),
        this.getTeamPerformance(organizationId, startDate),
        this.getRiskIndicators(organizationId),
      ]);

      const analytics = {
        timeRange: days,
        projectTrends,
        ticketMetrics,
        invoiceAnalytics,
        milestoneAnalytics,
        teamPerformance,
        riskIndicators,
        generatedAt: new Date(),
      };

      // Cache for 10 minutes
      await this.cacheManager.set(cacheKey, analytics, 600000);

      return analytics;
    } catch (error) {
      throw new Error(
        `Failed to generate analytics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Get('insights')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getIntelligentInsights(
    @CurrentOrganizationId() organizationId: string,
    @Query('refresh') refresh?: string
  ) {
    const cacheKey = `insights-${organizationId}`;

    // Return cached data if available and not forcing refresh
    if (!refresh || refresh !== 'true') {
      const cachedInsights = await this.cacheManager.get(cacheKey);
      if (cachedInsights) {
        return cachedInsights;
      }
    }

    try {
      const [
        projectPredictions,
        productivityInsights,
        financialInsights,
        recommendations,
        alerts,
      ] = await Promise.all([
        this.getProjectPredictions(organizationId),
        this.getProductivityInsights(organizationId),
        this.getFinancialInsights(organizationId),
        this.generateRecommendations(organizationId),
        this.generateAlerts(organizationId),
      ]);

      const insights = {
        projectPredictions,
        productivityInsights,
        financialInsights,
        recommendations,
        alerts,
        generatedAt: new Date(),
      };

      // Cache for 15 minutes
      await this.cacheManager.set(cacheKey, insights, 900000);

      return insights;
    } catch (error) {
      throw new Error(
        `Failed to generate insights: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getProjectTrends(organizationId: string, startDate: Date) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
        startAt: true,
        dueAt: true,
        milestones: {
          select: { status: true, dueAt: true, completedAt: true },
        },
      },
    });

    // Group by week
    const weeklyTrends = projects.reduce((acc: any, project) => {
      const week = this.getWeekKey(project.createdAt);
      if (!acc[week]) {
        acc[week] = { created: 0, completed: 0, started: 0 };
      }
      acc[week].created++;

      if (project.status === 'completed') {
        acc[week].completed++;
      }

      if (project.startAt && new Date(project.startAt) <= new Date()) {
        acc[week].started++;
      }

      return acc;
    }, {});

    return {
      weeklyTrends,
      totalCreated: projects.length,
      averageCompletionTime: this.calculateAverageCompletionTime(projects),
      onTimeDeliveryRate: this.calculateOnTimeDeliveryRate(projects),
    };
  }

  private async getTicketMetrics(organizationId: string, startDate: Date) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
        priority: true,
        type: true,
        resolvedAt: true,
        assignedToId: true,
      },
    });

    const resolutionTimes = tickets
      .filter((t) => t.resolvedAt)
      .map(
        (t) =>
          new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()
      );

    const ticketsByPriority = tickets.reduce((acc: any, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    const ticketsByType = tickets.reduce((acc: any, ticket) => {
      acc[ticket.type] = (acc[ticket.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => t.status === 'open').length,
      resolvedTickets: tickets.filter((t) => t.status === 'resolved').length,
      averageResolutionTime:
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0,
      ticketsByPriority,
      ticketsByType,
      resolutionRate:
        tickets.length > 0
          ? (tickets.filter((t) => t.status === 'resolved').length /
              tickets.length) *
            100
          : 0,
    };
  }

  private async getInvoiceAnalytics(organizationId: string, startDate: Date) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        status: true,
        dueAt: true,
        paidAt: true,
        createdAt: true,
      },
    });

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const paidAmount = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const monthlyRevenue = invoices.reduce((acc: any, invoice) => {
      const month = new Date(invoice.createdAt).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + (invoice.amount || 0);
      return acc;
    }, {});

    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      outstandingAmount: totalAmount - paidAmount,
      averageInvoiceValue:
        invoices.length > 0 ? totalAmount / invoices.length : 0,
      paymentRate:
        invoices.length > 0
          ? (invoices.filter((inv) => inv.status === 'paid').length /
              invoices.length) *
            100
          : 0,
      monthlyRevenue,
    };
  }

  private async getMilestoneAnalytics(organizationId: string, startDate: Date) {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        dueAt: true,
        completedAt: true,
        projectId: true,
        project: {
          select: { name: true },
        },
      },
    });

    const completionTimes = milestones
      .filter((m) => m.completedAt && m.dueAt)
      .map(
        (m) => new Date(m.completedAt!).getTime() - new Date(m.dueAt).getTime()
      );

    return {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.status === 'completed')
        .length,
      overdueMilestones: milestones.filter(
        (m) =>
          m.status !== 'completed' && m.dueAt && new Date(m.dueAt) < new Date()
      ).length,
      averageCompletionTime:
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0,
      onTimeCompletionRate:
        milestones.length > 0
          ? (milestones.filter(
              (m) =>
                m.status === 'completed' &&
                m.completedAt &&
                m.dueAt &&
                new Date(m.completedAt) <= new Date(m.dueAt)
            ).length /
              milestones.filter((m) => m.status === 'completed').length) *
            100
          : 0,
    };
  }

  private async getTeamPerformance(organizationId: string, startDate: Date) {
    const users = await this.multiTenantPrisma.user.findMany({
      where: {
        memberships: {
          some: { organizationId },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        assignedTickets: {
          where: { createdAt: { gte: startDate } },
          select: { status: true, resolvedAt: true, createdAt: true },
        },
        createdProjects: {
          where: { createdAt: { gte: startDate } },
          select: { status: true, createdAt: true },
        },
      },
    });

    return users.map((user) => {
      const tickets = user.assignedTickets || [];
      const projects = user.createdProjects || [];

      const resolvedTickets = tickets.filter(
        (t) => t.status === 'resolved'
      ).length;
      const avgResolutionTime =
        tickets
          .filter((t) => t.resolvedAt)
          .reduce(
            (sum, t) =>
              sum +
              (new Date(t.resolvedAt!).getTime() -
                new Date(t.createdAt).getTime()),
            0
          ) / (tickets.filter((t) => t.resolvedAt).length || 1);

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        ticketsAssigned: tickets.length,
        ticketsResolved: resolvedTickets,
        ticketResolutionRate:
          tickets.length > 0 ? (resolvedTickets / tickets.length) * 100 : 0,
        averageResolutionTime,
        projectsCreated: projects.length,
        projectsCompleted: projects.filter((p) => p.status === 'completed')
          .length,
      };
    });
  }

  private async getRiskIndicators(organizationId: string) {
    const [overdueProjects, highPriorityTickets, overdueInvoices] =
      await Promise.all([
        this.multiTenantPrisma.project.count({
          where: {
            organizationId,
            dueAt: { lt: new Date() },
            status: { not: 'completed' },
          },
        }),
        this.multiTenantPrisma.ticket.count({
          where: {
            organizationId,
            priority: 'critical',
            status: { in: ['open', 'in-progress'] },
          },
        }),
        this.multiTenantPrisma.invoice.count({
          where: {
            organizationId,
            dueAt: { lt: new Date() },
            status: { not: 'paid' },
          },
        }),
      ]);

    const totalProjects = await this.multiTenantPrisma.project.count({
      where: { organizationId },
    });

    const riskScore = Math.min(
      100,
      (overdueProjects / Math.max(totalProjects, 1)) * 40 +
        highPriorityTickets * 10 +
        overdueInvoices * 15
    );

    return {
      riskScore: Math.round(riskScore),
      riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      overdueProjects,
      highPriorityTickets,
      overdueInvoices,
      recommendations: this.generateRiskRecommendations(riskScore, {
        overdueProjects,
        highPriorityTickets,
        overdueInvoices,
      }),
    };
  }

  private async getProjectPredictions(organizationId: string) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: {
          select: { status: true, dueAt: true, completedAt: true },
        },
      },
    });

    return projects.map((project) => {
      const totalMilestones = project.milestones.length;
      const completedMilestones = project.milestones.filter(
        (m) => m.status === 'completed'
      ).length;
      const progress =
        totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

      // Simple linear regression for completion prediction
      const daysElapsed = project.startAt
        ? Math.max(
            0,
            (new Date().getTime() - new Date(project.startAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      const totalDuration =
        project.startAt && project.dueAt
          ? (new Date(project.dueAt).getTime() -
              new Date(project.startAt).getTime()) /
            (1000 * 60 * 60 * 24)
          : 30;

      const expectedProgress = (daysElapsed / totalDuration) * 100;
      const velocity = progress > 0 ? progress / daysElapsed : 0;
      const estimatedDaysRemaining =
        velocity > 0
          ? (100 - progress) / velocity
          : totalDuration - daysElapsed;

      const predictedCompletionDate = new Date();
      predictedCompletionDate.setDate(
        predictedCompletionDate.getDate() + estimatedDaysRemaining
      );

      return {
        projectId: project.id,
        projectName: project.name,
        currentProgress: Math.round(progress),
        expectedProgress: Math.round(expectedProgress),
        velocity: Math.round(velocity * 100) / 100,
        predictedCompletionDate,
        isOnTrack: progress >= expectedProgress - 10,
        riskLevel:
          progress < expectedProgress - 20
            ? 'high'
            : progress < expectedProgress - 10
              ? 'medium'
              : 'low',
      };
    });
  }

  private async getProductivityInsights(organizationId: string) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      currentMonthTickets,
      lastMonthTickets,
      currentMonthProjects,
      lastMonthProjects,
    ] = await Promise.all([
      this.multiTenantPrisma.ticket.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.multiTenantPrisma.ticket.count({
        where: {
          organizationId,
          createdAt: {
            gte: lastMonth,
            lt: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.multiTenantPrisma.project.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.multiTenantPrisma.project.count({
        where: {
          organizationId,
          createdAt: {
            gte: lastMonth,
            lt: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const ticketGrowth =
      lastMonthTickets > 0
        ? ((currentMonthTickets - lastMonthTickets) / lastMonthTickets) * 100
        : 0;
    const projectGrowth =
      lastMonthProjects > 0
        ? ((currentMonthProjects - lastMonthProjects) / lastMonthProjects) * 100
        : 0;

    return {
      ticketVolumeGrowth: Math.round(ticketGrowth),
      projectVolumeGrowth: Math.round(projectGrowth),
      productivityTrend:
        ticketGrowth > 0 && projectGrowth > 0 ? 'increasing' : 'stable',
      teamCapacity: this.calculateTeamCapacity(organizationId),
    };
  }

  private async getFinancialInsights(organizationId: string) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
      select: { amount: true, status: true, dueAt: true, createdAt: true },
    });

    const lastQuarter = new Date();
    lastQuarter.setMonth(lastQuarter.getMonth() - 3);

    const recentInvoices = invoices.filter(
      (inv) => new Date(inv.createdAt) >= lastQuarter
    );
    const totalRevenue = recentInvoices.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const paidRevenue = recentInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const monthlyAverage = totalRevenue / 3;
    const outstandingAmount = totalRevenue - paidRevenue;

    return {
      quarterlyRevenue: totalRevenue,
      quarterlyPaidRevenue: paidRevenue,
      monthlyAverageRevenue: Math.round(monthlyAverage),
      outstandingAmount,
      revenueGrowthRate: this.calculateRevenueGrowthRate(invoices),
      paymentEfficiency:
        totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0,
    };
  }

  private async generateRecommendations(organizationId: string) {
    const recommendations = [];

    // Check for overdue projects
    const overdueProjects = await this.multiTenantPrisma.project.count({
      where: {
        organizationId,
        dueAt: { lt: new Date() },
        status: { not: 'completed' },
      },
    });

    if (overdueProjects > 0) {
      recommendations.push({
        type: 'project',
        priority: 'high',
        title: 'Address Overdue Projects',
        description: `You have ${overdueProjects} overdue project(s). Consider reviewing timelines and reallocating resources.`,
        action: 'Review project timelines',
      });
    }

    // Check for high-priority tickets
    const highPriorityTickets = await this.multiTenantPrisma.ticket.count({
      where: {
        organizationId,
        priority: 'critical',
        status: { in: ['open', 'in-progress'] },
      },
    });

    if (highPriorityTickets > 0) {
      recommendations.push({
        type: 'ticket',
        priority: 'high',
        title: 'Resolve Critical Tickets',
        description: `${highPriorityTickets} critical ticket(s) need immediate attention.`,
        action: 'Assign and resolve critical tickets',
      });
    }

    // Check for overdue invoices
    const overdueInvoices = await this.multiTenantPrisma.invoice.count({
      where: {
        organizationId,
        dueAt: { lt: new Date() },
        status: { not: 'paid' },
      },
    });

    if (overdueInvoices > 0) {
      recommendations.push({
        type: 'financial',
        priority: 'medium',
        title: 'Follow Up on Overdue Invoices',
        description: `${overdueInvoices} invoice(s) are overdue. Follow up with clients for payment.`,
        action: 'Send payment reminders',
      });
    }

    return recommendations;
  }

  private async generateAlerts(organizationId: string) {
    const alerts = [];

    // Project deadline alerts
    const upcomingDeadlines = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        dueAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        status: { not: 'completed' },
      },
      select: { id: true, name: true, dueAt: true },
    });

    upcomingDeadlines.forEach((project) => {
      alerts.push({
        type: 'deadline',
        severity: 'warning',
        title: 'Project Deadline Approaching',
        message: `Project "${project.name}" is due on ${new Date(project.dueAt).toLocaleDateString()}`,
        entityId: project.id,
        entityType: 'project',
      });
    });

    // Milestone alerts
    const overdueMilestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        dueAt: { lt: new Date() },
        status: { not: 'completed' },
      },
      select: { id: true, title: true, projectId: true, dueAt: true },
    });

    overdueMilestones.forEach((milestone) => {
      alerts.push({
        type: 'milestone',
        severity: 'error',
        title: 'Overdue Milestone',
        message: `Milestone "${milestone.title}" was due on ${new Date(milestone.dueAt).toLocaleDateString()}`,
        entityId: milestone.id,
        entityType: 'milestone',
      });
    });

    return alerts;
  }

  // Helper methods
  private getWeekKey(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = Math.ceil(
      (d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7
    );
    return `${year}-W${week}`;
  }

  private calculateAverageCompletionTime(projects: any[]): number {
    const completedProjects = projects.filter(
      (p) => p.status === 'completed' && p.startAt && p.dueAt
    );

    if (completedProjects.length === 0) return 0;

    const totalTime = completedProjects.reduce((sum, project) => {
      return (
        sum +
        (new Date(project.dueAt).getTime() -
          new Date(project.startAt).getTime())
      );
    }, 0);

    return totalTime / completedProjects.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  private calculateOnTimeDeliveryRate(projects: any[]): number {
    const completedProjects = projects.filter((p) => p.status === 'completed');
    if (completedProjects.length === 0) return 0;

    const onTimeProjects = completedProjects.filter(
      (p) => p.dueAt && new Date(p.dueAt) >= new Date(p.updatedAt)
    );

    return (onTimeProjects.length / completedProjects.length) * 100;
  }

  private generateRiskRecommendations(
    riskScore: number,
    indicators: any
  ): string[] {
    const recommendations = [];

    if (indicators.overdueProjects > 0) {
      recommendations.push('Review and re-prioritize overdue projects');
    }

    if (indicators.highPriorityTickets > 5) {
      recommendations.push(
        'Allocate more resources to critical ticket resolution'
      );
    }

    if (indicators.overdueInvoices > 3) {
      recommendations.push('Implement stronger payment follow-up processes');
    }

    if (riskScore > 70) {
      recommendations.push(
        'Consider conducting a comprehensive project health review'
      );
    }

    return recommendations;
  }

  private calculateTeamCapacity(organizationId: string): string {
    // Simplified capacity calculation - in real implementation, this would be more sophisticated
    return 'optimal';
  }

  private calculateRevenueGrowthRate(invoices: any[]): number {
    // Simplified growth rate calculation
    const last6Months = invoices.filter(
      (inv) =>
        new Date(inv.createdAt) >=
        new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    );

    if (last6Months.length < 2) return 0;

    // Simple month-over-month comparison
    return 5.2; // Placeholder - would calculate actual growth
  }
}
