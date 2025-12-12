import { Injectable } from '@nestjs/common';
import { DashboardGateway } from './dashboard.gateway';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardGateway: DashboardGateway,
    private readonly multiTenantPrisma: MultiTenantPrismaService
  ) {}

  // Real-time update triggers for different events

  async notifyProjectUpdate(organizationId: string, projectId: string) {
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: projectId },
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
    });

    if (project) {
      // Calculate project metrics
      const totalMilestones = (project as any).milestones?.length || 0;
      const completedMilestones =
        (project as any).milestones?.filter(
          (m: any) => m.status === 'completed'
        ).length || 0;
      const progress =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      const openTickets =
        (project as any).tickets?.filter(
          (t: any) => t.status === 'open' || t.status === 'in-progress'
        ).length || 0;

      const projectData = {
        id: project.id,
        name: project.name,
        status: project.status,
        progress,
        totalMilestones,
        completedMilestones,
        openTickets,
        updatedAt: project.updatedAt,
      };

      this.dashboardGateway.broadcastProjectUpdate(organizationId, projectData);
    }
  }

  async notifyTicketUpdate(organizationId: string, ticketId: string) {
    const ticket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
        project: {
          select: { name: true },
        },
      },
    });

    if (ticket) {
      const ticketData = {
        id: ticket.id,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        projectName: (ticket as any).project?.name || 'Unassigned',
        createdAt: ticket.createdAt,
      };

      this.dashboardGateway.broadcastTicketUpdate(organizationId, ticketData);
    }
  }

  async notifyInvoiceUpdate(organizationId: string, invoiceId: string) {
    const invoice = await this.multiTenantPrisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        dueAt: true,
        createdAt: true,
        project: {
          select: { name: true },
        },
      },
    });

    if (invoice) {
      const invoiceData = {
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        dueAt: invoice.dueAt,
        projectName: (invoice as any).project?.name || 'Unassigned',
        createdAt: invoice.createdAt,
      };

      this.dashboardGateway.broadcastInvoiceUpdate(organizationId, invoiceData);
    }
  }

  async notifyStatsUpdate(organizationId: string) {
    // Calculate current stats
    const [projectsStats, ticketsStats, invoicesStats, milestonesStats] =
      await Promise.all([
        this.getProjectsStats(organizationId),
        this.getTicketsStats(organizationId),
        this.getInvoicesStats(organizationId),
        this.getMilestonesStats(organizationId),
      ]);

    const stats = {
      projects: projectsStats,
      tickets: ticketsStats,
      invoices: invoicesStats,
      milestones: milestonesStats,
    };

    this.dashboardGateway.broadcastStatsUpdate(organizationId, stats);
  }

  async notifyActivityUpdate(organizationId: string, activity: any) {
    this.dashboardGateway.broadcastActivityUpdate(organizationId, activity);
  }

  // Helper methods for calculating stats (same as in controller)
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
}
