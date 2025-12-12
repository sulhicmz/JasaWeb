import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache
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

  // New Advanced Analytics Endpoints

  @Get('analytics/performance')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer)
  async getPerformanceAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('period') period: string = '30' // days
  ) {
    const days = Math.min(parseInt(period) || 30, 365); // Cap at 1 year
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [projectTrends, ticketTrends, milestoneTrends, invoiceTrends] =
      await Promise.all([
        this.getProjectTrends(organizationId, startDate),
        this.getTicketTrends(organizationId, startDate),
        this.getMilestoneTrends(organizationId, startDate),
        this.getInvoiceTrends(organizationId, startDate),
      ]);

    return {
      period: days,
      projectTrends,
      ticketTrends,
      milestoneTrends,
      invoiceTrends,
    };
  }

  @Get('analytics/financial')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance)
  async getFinancialAnalytics(
    @CurrentOrganizationId() organizationId: string,
    @Query('period') period: string = '90' // days
  ) {
    const days = Math.min(parseInt(period) || 90, 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [revenueMetrics, paymentTrends, outstandingInvoices] =
      await Promise.all([
        this.getRevenueMetrics(organizationId, startDate),
        this.getPaymentTrends(organizationId, startDate),
        this.getOutstandingInvoices(organizationId),
      ]);

    return {
      period: days,
      revenueMetrics,
      paymentTrends,
      outstandingInvoices,
    };
  }

  // Helper methods for analytics
  private async getProjectTrends(organizationId: string, startDate: Date) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
        startAt: true,
        dueAt: true,
      },
    });

    // Calculate completion rates
    const completedProjects = projects.filter(
      (p) => p.status === 'completed'
    ).length;
    const totalProjects = projects.length;
    const completionRate =
      totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // Average project duration
    const completedProjectsWithDuration = projects.filter(
      (p) => p.status === 'completed' && p.startAt && p.updatedAt
    );
    const avgDuration =
      completedProjectsWithDuration.length > 0
        ? completedProjectsWithDuration.reduce(
            (sum, p) =>
              sum +
              (new Date(p.updatedAt).getTime() -
                new Date(p.startAt!).getTime()),
            0
          ) /
          completedProjectsWithDuration.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0;

    return {
      completionRate: Math.round(completionRate),
      averageDuration: Math.round(avgDuration),
      totalProjects,
      completedProjects,
    };
  }

  private async getTicketTrends(organizationId: string, startDate: Date) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        priority: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Resolution metrics
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved' || t.status === 'closed'
    );
    const totalTickets = tickets.length;
    const resolutionRate =
      totalTickets > 0 ? (resolvedTickets.length / totalTickets) * 100 : 0;

    // Average resolution time
    const resolvedTicketsWithTime = resolvedTickets.filter((t) => t.updatedAt);
    const avgResolutionTime =
      resolvedTicketsWithTime.length > 0
        ? resolvedTicketsWithTime.reduce(
            (sum, t) =>
              sum +
              (new Date(t.updatedAt).getTime() -
                new Date(t.createdAt).getTime()),
            0
          ) /
          resolvedTicketsWithTime.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0;

    // Priority distribution
    const priorityDistribution = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      resolutionRate: Math.round(resolutionRate),
      averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      priorityDistribution,
      totalTickets,
      resolvedTickets: resolvedTickets.length,
    };
  }

  private async getMilestoneTrends(organizationId: string, startDate: Date) {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });

    const completedMilestones = milestones.filter(
      (m) => m.status === 'completed'
    );
    const overdueMilestones = milestones.filter(
      (m) =>
        m.status !== 'completed' && m.dueAt && new Date(m.dueAt) < new Date()
    );

    const completionRate =
      milestones.length > 0
        ? (completedMilestones.length / milestones.length) * 100
        : 0;
    const overdueRate =
      milestones.length > 0
        ? (overdueMilestones.length / milestones.length) * 100
        : 0;

    return {
      completionRate: Math.round(completionRate),
      overdueRate: Math.round(overdueRate),
      totalMilestones: milestones.length,
      completedMilestones: completedMilestones.length,
      overdueMilestones: overdueMilestones.length,
    };
  }

  private async getInvoiceTrends(organizationId: string, startDate: Date) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        dueAt: true,
      },
    });

    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
    const pendingRevenue = invoices
      .filter((i) => i.status === 'issued' || i.status === 'draft')
      .reduce((sum, i) => sum + i.amount, 0);

    const paymentRate =
      invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0;

    return {
      totalRevenue,
      pendingRevenue,
      paymentRate: Math.round(paymentRate),
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
    };
  }

  private async getRevenueMetrics(organizationId: string, startDate: Date) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });

    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
    const averageInvoiceValue =
      paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    // Simplified revenue by project (without joins for now)
    const revenueByProject = {
      Unassigned: totalRevenue,
    };

    return {
      totalRevenue,
      averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
      paidInvoices: paidInvoices.length,
      totalInvoices: invoices.length,
      revenueByProject,
    };
  }

  private async getPaymentTrends(organizationId: string, startDate: Date) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        status: true,
        createdAt: true,
        dueAt: true,
      },
    });

    const overdueInvoices = invoices.filter(
      (i) =>
        (i.status === 'issued' || i.status === 'overdue') &&
        new Date(i.dueAt) < new Date()
    );

    return {
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.amount, 0),
      overdueCount: overdueInvoices.length,
    };
  }

  private async getOutstandingInvoices(organizationId: string) {
    const outstanding = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['issued', 'overdue'] },
      },
      include: {
        project: {
          select: { name: true },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    return outstanding.map((invoice: any) => ({
      id: invoice.id,
      amount: invoice.amount,
      dueAt: invoice.dueAt,
      status: invoice.status,
      projectName: 'Unassigned', // Simplified for now
      daysOverdue: Math.max(
        0,
        Math.floor(
          (new Date().getTime() - new Date(invoice.dueAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      ),
    }));
  }

  // Existing helper methods
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
}
