import { Injectable } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import {
  DashboardStatsResponseDto,
  RecentActivityDto,
  ProjectOverviewDto,
  DashboardKpiDto,
  DashboardTimeRange,
  ProjectStatsDto,
  TicketStatsDto,
  InvoiceStatsDto,
  MilestoneStatsDto,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getDashboardStats(
    organizationId: string,
    timeRange: DashboardTimeRange = DashboardTimeRange.MONTH,
    refresh: boolean = false
  ): Promise<DashboardStatsResponseDto> {
    const cacheKey = `dashboard-stats-${organizationId}-${timeRange}`;

    // Return cached data if available and not forcing refresh
    if (!refresh) {
      const cachedStats =
        await this.cacheManager.get<DashboardStatsResponseDto>(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }
    }

    // Get date range for filtering
    const dateRange = this.getDateRange(timeRange);

    // Execute all queries in parallel for better performance
    const [projectsStats, ticketsStats, invoicesStats, milestonesStats] =
      await Promise.all([
        this.getProjectsStats(organizationId, dateRange),
        this.getTicketsStats(organizationId, dateRange),
        this.getInvoicesStats(organizationId, dateRange),
        this.getMilestonesStats(organizationId, dateRange),
      ]);

    const stats: DashboardStatsResponseDto = {
      projects: projectsStats,
      tickets: ticketsStats,
      invoices: invoicesStats,
      milestones: milestonesStats,
      lastUpdated: new Date(),
      timeRange,
    };

    // Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, stats, 300000);

    return stats;
  }

  async getRecentActivity(
    organizationId: string,
    limit: number = 10,
    type?: string
  ): Promise<RecentActivityDto[]> {
    const limitNum = Math.min(limit, 50); // Cap at 50 items

    const [recentProjects, recentTickets, recentMilestones, recentInvoices] =
      await Promise.all([
        type === 'project' || !type
          ? this.getRecentProjects(organizationId, Math.ceil(limitNum / 4))
          : [],
        type === 'ticket' || !type
          ? this.getRecentTickets(organizationId, Math.ceil(limitNum / 4))
          : [],
        type === 'milestone' || !type
          ? this.getRecentMilestones(organizationId, Math.ceil(limitNum / 4))
          : [],
        type === 'invoice' || !type
          ? this.getRecentInvoices(organizationId, Math.ceil(limitNum / 4))
          : [],
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

  async getProjectsOverview(
    organizationId: string,
    limit: number = 6,
    status?: string,
    sortBy: string = 'updatedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ProjectOverviewDto[]> {
    const limitNum = Math.min(limit, 20);

    const whereClause: any = { organizationId };
    if (status) {
      whereClause.status = status;
    }

    const orderByClause: any = {};
    orderByClause[sortBy] = sortOrder;

    const projects = await this.multiTenantPrisma.project.findMany({
      where: whereClause,
      include: {
        milestones: {
          select: {
            id: true,
            status: true,
            dueAt: true,
            title: true,
          },
          orderBy: { dueAt: 'asc' },
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
      orderBy: orderByClause,
      take: limitNum,
    });

    // Calculate progress and additional metrics for each project
    return projects.map((project: any) => {
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

      // Find next milestone
      const nextMilestone = project.milestones?.find(
        (m: any) => m.status !== 'completed' && m.dueAt
      );

      // Calculate project health
      const health = this.calculateProjectHealth(
        progress,
        openTickets,
        highPriorityTickets,
        project.dueAt
      );

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
        nextMilestoneDue: nextMilestone?.dueAt,
        health,
      };
    });
  }

  async getDashboardKpi(organizationId: string): Promise<DashboardKpiDto> {
    const cacheKey = `dashboard-kpi-${organizationId}`;

    // Check cache first
    const cachedKpi = await this.cacheManager.get<DashboardKpiDto>(cacheKey);
    if (cachedKpi) {
      return cachedKpi;
    }

    // Calculate KPIs
    const [
      clientSatisfaction,
      averageDeliveryTime,
      slaCompliance,
      revenueGrowth,
      clientRetentionRate,
      projectSuccessRate,
    ] = await Promise.all([
      this.calculateClientSatisfaction(organizationId),
      this.calculateAverageDeliveryTime(organizationId),
      this.calculateSlaCompliance(organizationId),
      this.calculateRevenueGrowth(organizationId),
      this.calculateClientRetentionRate(organizationId),
      this.calculateProjectSuccessRate(organizationId),
    ]);

    const kpi: DashboardKpiDto = {
      clientSatisfaction,
      averageDeliveryTime,
      slaCompliance,
      revenueGrowth,
      clientRetentionRate,
      projectSuccessRate,
    };

    // Cache KPIs for 1 hour (3600 seconds)
    await this.cacheManager.set(cacheKey, kpi, 3600000);

    return kpi;
  }

  private async getProjectsStats(
    organizationId: string,
    dateRange: { start: Date; end: Date }
  ) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        status: true,
        dueAt: true,
        milestones: { select: { status: true } },
      },
    });

    const total = projects.length;
    const active = projects.filter(
      (p) => p.status === 'active' || p.status === 'in-progress'
    ).length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const onHold = projects.filter((p) => p.status === 'on-hold').length;
    const planning = projects.filter((p) => p.status === 'planning').length;

    // Calculate average progress
    const totalProgress = projects.reduce((sum, project) => {
      const completedMilestones =
        project.milestones?.filter((m) => m.status === 'completed').length || 0;
      const totalMilestones = project.milestones?.length || 0;
      return (
        sum +
        (totalMilestones > 0
          ? (completedMilestones / totalMilestones) * 100
          : 0)
      );
    }, 0);
    const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    // Calculate overdue projects
    const now = new Date();
    const overdue = projects.filter(
      (p) => p.dueAt && new Date(p.dueAt) < now && p.status !== 'completed'
    ).length;

    return {
      total,
      active,
      completed,
      onHold,
      planning,
      averageProgress,
      overdue,
    };
  }

  private async getTicketsStats(
    organizationId: string,
    dateRange: { start: Date; end: Date }
  ) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        dueAt: true,
      },
    });

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in-progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
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

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t) => t.resolvedAt);
    const totalResolutionTime = resolvedTickets.reduce(
      (sum, ticket) =>
        sum +
        (new Date(ticket.resolvedAt!).getTime() -
          new Date(ticket.createdAt).getTime()),
      0
    );
    const averageResolutionTime =
      resolvedTickets.length > 0
        ? Math.round(
            totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60)
          ) // Convert to hours
        : 0;

    // Calculate overdue tickets
    const now = new Date();
    const overdue = tickets.filter(
      (t) => t.dueAt && new Date(t.dueAt) < now && t.status !== 'resolved'
    ).length;

    return {
      total,
      open,
      inProgress,
      resolved,
      highPriority,
      critical,
      averageResolutionTime,
      overdue,
    };
  }

  private async getInvoicesStats(
    organizationId: string,
    dateRange: { start: Date; end: Date }
  ) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: { status: true, amount: true, dueAt: true, paidAt: true },
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
    const paid = invoices.filter((i) => i.status === 'paid').length;

    const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingAmount = invoices
      .filter((i) => i.status === 'draft' || i.status === 'issued')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const overdueAmount = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const paidAmount = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    return {
      total,
      pending,
      overdue,
      paid,
      totalAmount,
      pendingAmount,
      overdueAmount,
      paidAmount,
    };
  }

  private async getMilestonesStats(
    organizationId: string,
    dateRange: { start: Date; end: Date }
  ) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
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
    const dueThisMonth = milestones.filter(
      (m) =>
        m.status !== 'completed' &&
        m.dueAt &&
        new Date(m.dueAt) >= now &&
        new Date(m.dueAt) <= monthFromNow
    ).length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      dueThisWeek,
      dueThisMonth,
      completionRate,
    };
  }

  private async getRecentProjects(
    organizationId: string,
    limit: number
  ): Promise<RecentActivityDto[]> {
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
      projectId: project.id,
      projectName: project.name,
    }));
  }

  private async getRecentTickets(
    organizationId: string,
    limit: number
  ): Promise<RecentActivityDto[]> {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: { organizationId },
      select: {
        id: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
        projectId: true,
        project: {
          select: { name: true },
        },
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
      projectId: ticket.projectId,
      projectName: ticket.project?.name,
    }));
  }

  private async getRecentMilestones(
    organizationId: string,
    limit: number
  ): Promise<RecentActivityDto[]> {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: { organizationId },
      select: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        createdAt: true,
        projectId: true,
        project: {
          select: { name: true },
        },
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
      projectId: milestone.projectId,
      projectName: milestone.project?.name,
    }));
  }

  private async getRecentInvoices(
    organizationId: string,
    limit: number
  ): Promise<RecentActivityDto[]> {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        amount: true,
        dueAt: true,
        createdAt: true,
        projectId: true,
        project: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      type: 'invoice' as const,
      title: `Invoice ${invoice.id.slice(-8)}`, // Use last 8 chars of ID as invoice number
      description: `Amount: $${invoice.amount}`,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueAt,
      projectId: invoice.projectId,
      projectName: invoice.project?.name,
    }));
  }

  private calculateProjectHealth(
    progress: number,
    openTickets: number,
    highPriorityTickets: number,
    dueAt?: Date
  ): 'excellent' | 'good' | 'at-risk' | 'critical' {
    const now = new Date();
    const isOverdue = dueAt && new Date(dueAt) < now;

    if (isOverdue || highPriorityTickets > 3) {
      return 'critical';
    }

    if (progress < 25 || highPriorityTickets > 1 || openTickets > 5) {
      return 'at-risk';
    }

    if (progress > 75 && highPriorityTickets === 0) {
      return 'excellent';
    }

    return 'good';
  }

  private getDateRange(timeRange: DashboardTimeRange): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (timeRange) {
      case DashboardTimeRange.TODAY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case DashboardTimeRange.WEEK:
        start.setDate(now.getDate() - 7);
        break;
      case DashboardTimeRange.MONTH:
        start.setMonth(now.getMonth() - 1);
        break;
      case DashboardTimeRange.QUARTER:
        start.setMonth(now.getMonth() - 3);
        break;
      case DashboardTimeRange.YEAR:
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  // KPI calculation methods (simplified implementations)
  private async calculateClientSatisfaction(
    organizationId: string
  ): Promise<number> {
    // In a real implementation, this would calculate based on feedback/ratings
    // For now, return a mock value
    return 8.5;
  }

  private async calculateAverageDeliveryTime(
    organizationId: string
  ): Promise<number> {
    const completedProjects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId, status: 'completed' },
      select: { startAt: true, completedAt: true },
    });

    if (completedProjects.length === 0) return 0;

    const totalDays = completedProjects.reduce((sum, project) => {
      if (project.startAt && project.completedAt) {
        const days = Math.ceil(
          (new Date(project.completedAt).getTime() -
            new Date(project.startAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);

    return Math.round(totalDays / completedProjects.length);
  }

  private async calculateSlaCompliance(
    organizationId: string
  ): Promise<number> {
    // Calculate percentage of tickets resolved within SLA
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: { organizationId, status: 'resolved' },
      select: { createdAt: true, resolvedAt: true },
    });

    if (tickets.length === 0) return 100;

    // Assuming 4-hour SLA for ticket response
    const slaHours = 4;
    const compliantTickets = tickets.filter((ticket) => {
      const responseTime =
        (new Date(ticket.resolvedAt!).getTime() -
          new Date(ticket.createdAt).getTime()) /
        (1000 * 60 * 60);
      return responseTime <= slaHours;
    });

    return Math.round((compliantTickets.length / tickets.length) * 100);
  }

  private async calculateRevenueGrowth(
    organizationId: string
  ): Promise<number> {
    // Calculate revenue growth compared to previous period
    // Simplified implementation
    return 15.5;
  }

  private async calculateClientRetentionRate(
    organizationId: string
  ): Promise<number> {
    // Calculate percentage of clients who continue working with the company
    // Simplified implementation
    return 92.0;
  }

  private async calculateProjectSuccessRate(
    organizationId: string
  ): Promise<number> {
    const totalProjects = await this.multiTenantPrisma.project.count({
      where: { organizationId },
    });

    const completedProjects = await this.multiTenantPrisma.project.count({
      where: { organizationId, status: 'completed' },
    });

    return totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;
  }
}
