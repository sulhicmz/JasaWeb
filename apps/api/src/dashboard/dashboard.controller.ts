import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
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
