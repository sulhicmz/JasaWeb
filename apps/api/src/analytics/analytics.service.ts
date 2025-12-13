import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { DateTime } from 'luxon';
import {
  ProjectWithRelations,
  UserWithRelations,
  InvoiceWithProject,
  TicketWithRelations,
  ProjectWhereClause,
  UserWhereClause,
  InvoiceWhereClause,
  TicketWhereClause,
  ProjectFilters,
  TeamPerformanceFilters,
  FinancialFilters,
  ActivityTrendsFilters,
  ProjectAnalytics,
  TeamPerformanceAnalytics,
  FinancialAnalytics,
  ClientInsightsAnalytics,
  ActivityTrendData,
  OverviewAnalytics,
} from './analytics.types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Project Analytics
  async getProjectAnalytics(
    organizationId: string,
    filters?: ProjectFilters
  ): Promise<ProjectAnalytics> {
    const whereClause: ProjectWhereClause = {
      organizationId,
    };

    if (filters?.projectId) {
      whereClause.id = filters.projectId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.createdAt = {};
      if (filters?.dateFrom) {
        whereClause.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters?.dateTo) {
        whereClause.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const projects = (await this.prisma.project.findMany({
      where: whereClause,
      include: {
        milestones: true,
        tasks: true,
        approvals: true,
        tickets: true,
        invoices: true,
      },
    })) as ProjectWithRelations[];

    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status === 'completed'
    ).length;
    const inProgressProjects = projects.filter(
      (p) => p.status === 'progress'
    ).length;
    const overdueProjects = projects.filter(
      (p) =>
        p.dueAt && new Date(p.dueAt) < new Date() && p.status !== 'completed'
    ).length;

    // Calculate milestone completion
    const totalMilestones = projects.reduce(
      (sum: number, p) => sum + p.milestones.length,
      0
    );
    const completedMilestones = projects.reduce(
      (sum: number, p) =>
        sum + p.milestones.filter((m) => m.status === 'completed').length,
      0
    );

    // Calculate task completion
    const totalTasks = projects.reduce(
      (sum: number, p) => sum + p.tasks.length,
      0
    );
    const completedTasks = projects.reduce(
      (sum: number, p) =>
        sum + p.tasks.filter((t) => t.status === 'completed').length,
      0
    );

    // Timeline adherence (projects completed on time)
    const completedOnTime = projects.filter(
      (p) =>
        p.status === 'completed' && p.dueAt && p.updatedAt <= new Date(p.dueAt)
    ).length;

    return {
      summary: {
        totalProjects,
        completedProjects,
        inProgressProjects,
        overdueProjects,
        completionRate:
          totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
        onTimeDeliveryRate:
          completedProjects > 0
            ? (completedOnTime / completedProjects) * 100
            : 0,
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        completionRate:
          totalMilestones > 0
            ? (completedMilestones / totalMilestones) * 100
            : 0,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    };
  }

  // Team Performance Analytics
  async getTeamPerformanceAnalytics(
    organizationId: string,
    filters?: TeamPerformanceFilters
  ): Promise<TeamPerformanceAnalytics[]> {
    const whereClause: UserWhereClause = {
      memberships: {
        some: {
          organizationId,
        },
      },
    };

    if (filters?.userId) {
      whereClause.id = filters.userId;
    }

    const users = (await this.prisma.user.findMany({
      where: whereClause,
      include: {
        memberships: {
          where: { organizationId },
        },
        assignedTasks: {
          where: {
            project: {
              organizationId,
            },
            ...(filters?.dateFrom || filters?.dateTo
              ? {
                  createdAt: {
                    ...(filters?.dateFrom && {
                      gte: new Date(filters.dateFrom),
                    }),
                    ...(filters?.dateTo && { lte: new Date(filters.dateTo) }),
                  },
                }
              : {}),
          },
        },
        approvals: {
          where: {
            project: {
              organizationId,
            },
            ...(filters?.dateFrom || filters?.dateTo
              ? {
                  createdAt: {
                    ...(filters?.dateFrom && {
                      gte: new Date(filters.dateFrom),
                    }),
                    ...(filters?.dateTo && { lte: new Date(filters.dateTo) }),
                  },
                }
              : {}),
          },
        },
        tickets: {
          where: {
            organizationId,
            ...(filters?.dateFrom || filters?.dateTo
              ? {
                  createdAt: {
                    ...(filters?.dateFrom && {
                      gte: new Date(filters.dateFrom),
                    }),
                    ...(filters?.dateTo && { lte: new Date(filters.dateTo) }),
                  },
                }
              : {}),
          },
        },
      },
    })) as UserWithRelations[];

    return users.map((user) => {
      const totalTasks = user.assignedTasks.length;
      const completedTasks = user.assignedTasks.filter(
        (t) => t.status === 'completed'
      ).length;
      const totalApprovals = user.approvals.length;
      const completedApprovals = user.approvals.filter(
        (a) => a.status !== 'pending'
      ).length;
      const totalTickets = user.tickets.length;
      const resolvedTickets = user.tickets.filter(
        (t) => t.status === 'resolved' || t.status === 'closed'
      ).length;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.memberships[0]?.role,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate:
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        approvals: {
          total: totalApprovals,
          completed: completedApprovals,
          completionRate:
            totalApprovals > 0
              ? (completedApprovals / totalApprovals) * 100
              : 0,
        },
        tickets: {
          total: totalTickets,
          resolved: resolvedTickets,
          resolutionRate:
            totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
        },
      };
    });
  }

  // Financial Analytics
  async getFinancialAnalytics(
    organizationId: string,
    filters?: FinancialFilters
  ): Promise<FinancialAnalytics> {
    const whereClause: InvoiceWhereClause = {
      organizationId,
    };

    if (filters?.projectId) {
      whereClause.projectId = filters.projectId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.issuedAt = {};
      if (filters?.dateFrom) {
        whereClause.issuedAt.gte = new Date(filters.dateFrom);
      }
      if (filters?.dateTo) {
        whereClause.issuedAt.lte = new Date(filters.dateTo);
      }
    }

    const invoices = (await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        project: true,
      },
    })) as InvoiceWithProject[];

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum: number, inv) => sum + inv.amount,
      0
    );
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const paidAmount = paidInvoices.reduce(
      (sum: number, inv) => sum + inv.amount,
      0
    );
    const overdueInvoices = invoices.filter(
      (inv) =>
        inv.status !== 'paid' &&
        inv.status !== 'cancelled' &&
        new Date(inv.dueAt) < new Date()
    );

    // Group by currency
    const byCurrency = invoices.reduce((acc, inv) => {
      const currency = inv.currency;
      // Validate currency to prevent object injection
      if (typeof currency === 'string' && /^[A-Z]{3}$/.test(currency)) {
        if (!acc.has(currency)) {
          acc.set(currency, { count: 0, amount: 0, paid: 0 });
        }
        const currencyData = acc.get(currency)!;
        currencyData.count++;
        currencyData.amount += inv.amount;
        if (inv.status === 'paid') {
          currencyData.paid += inv.amount;
        }
      }
      return acc;
    }, new Map<string, { count: number; amount: number; paid: number }>());

    // Group by month
    const byMonth = invoices.reduce((acc, inv) => {
      const month = DateTime.fromJSDate(inv.issuedAt).toFormat('yyyy-MM');
      // Validate month format to prevent object injection
      if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
        if (!acc.has(month)) {
          acc.set(month, { count: 0, amount: 0, paid: 0 });
        }
        const monthData = acc.get(month)!;
        monthData.count++;
        monthData.amount += inv.amount;
        if (inv.status === 'paid') {
          monthData.paid += inv.amount;
        }
      }
      return acc;
    }, new Map<string, { count: number; amount: number; paid: number }>());

    return {
      summary: {
        totalInvoices,
        totalAmount,
        paidAmount,
        outstandingAmount: totalAmount - paidAmount,
        paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
        overdueCount: overdueInvoices.length,
      },
      byCurrency: Object.fromEntries(byCurrency),
      byMonth: Object.fromEntries(byMonth),
    };
  }

  // Client Insights / SLA Analytics
  async getClientInsightsAnalytics(
    organizationId: string,
    filters?: ActivityTrendsFilters
  ): Promise<ClientInsightsAnalytics> {
    const whereClause: TicketWhereClause = {
      organizationId,
    };

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.createdAt = {};
      if (filters?.dateFrom) {
        whereClause.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters?.dateTo) {
        whereClause.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const tickets = (await this.prisma.ticket.findMany({
      where: whereClause,
      include: {
        assignee: true,
        project: true,
      },
    })) as TicketWithRelations[];

    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved' || t.status === 'closed'
    );
    const resolvedCount = resolvedTickets.length;

    // Calculate average resolution time (simplified - in real implementation, track resolution time)
    const criticalTickets = tickets.filter((t) => t.priority === 'critical');
    const highTickets = tickets.filter((t) => t.priority === 'high');
    const mediumTickets = tickets.filter((t) => t.priority === 'medium');
    const lowTickets = tickets.filter((t) => t.priority === 'low');

    // SLA compliance (tickets resolved within SLA)
    const slaCompliantTickets = resolvedTickets.filter(
      (t) => !t.slaDueAt || t.updatedAt <= new Date(t.slaDueAt)
    ).length;

    // Group by type
    const byTypeMap = tickets.reduce((acc, ticket) => {
      const type = ticket.type;
      if (!acc.has(type)) {
        acc.set(type, { total: 0, resolved: 0 });
      }
      const typeData = acc.get(type)!;
      typeData.total++;
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        typeData.resolved++;
      }
      return acc;
    }, new Map<string, { total: number; resolved: number }>());

    const byType = Object.fromEntries(byTypeMap);

    // Group by priority
    const byPriority = {
      critical: {
        total: criticalTickets.length,
        resolved: criticalTickets.filter(
          (t) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
      high: {
        total: highTickets.length,
        resolved: highTickets.filter(
          (t) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
      medium: {
        total: mediumTickets.length,
        resolved: mediumTickets.filter(
          (t) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
      low: {
        total: lowTickets.length,
        resolved: lowTickets.filter(
          (t) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
    };

    return {
      summary: {
        totalTickets,
        resolvedTickets: resolvedCount,
        resolutionRate:
          totalTickets > 0 ? (resolvedCount / totalTickets) * 100 : 0,
        slaComplianceRate:
          resolvedCount > 0 ? (slaCompliantTickets / resolvedCount) * 100 : 0,
      },
      byType,
      byPriority,
    };
  }

  // Activity trends over time
  async getActivityTrends(
    organizationId: string,
    filters?: ActivityTrendsFilters
  ): Promise<ActivityTrendData[]> {
    const granularity = filters?.granularity || 'day';
    const dateFrom = filters?.dateFrom
      ? new Date(filters.dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const dateTo = filters?.dateTo ? new Date(filters.dateTo) : new Date();

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by time period
    const trends = auditLogs.reduce(
      (acc: Map<string, ActivityTrendData>, log) => {
        let key: string;
        const date = DateTime.fromJSDate(log.createdAt);

        switch (granularity) {
          case 'week':
            key = date.startOf('week').toFormat('yyyy-MM-dd');
            break;
          case 'month':
            key = date.startOf('month').toFormat('yyyy-MM');
            break;
          default: // day
            key = date.toFormat('yyyy-MM-dd');
        }

        // Initialize if not exists - validate key to prevent object injection
        // eslint-disable-next-line security/detect-unsafe-regex
        const datePattern = /^\d{4}-\d{2}(-\d{2})?$/;
        if (typeof key === 'string' && datePattern.test(key)) {
          if (!acc.has(key)) {
            acc.set(key, {
              date: key,
              total: 0,
              user_login: 0,
              file_upload: 0,
              approval_request: 0,
              project_created: 0,
              task_completed: 0,
            });
          }

          const trendData = acc.get(key)!;
          trendData.total++;

          // Handle known actions
          const knownActions = [
            'user_login',
            'file_upload',
            'approval_request',
            'project_created',
            'task_completed',
          ];
          if (knownActions.includes(log.action)) {
            const currentCount =
              (trendData as Record<string, number>)[log.action] || 0;
            (trendData as Record<string, number>)[log.action] =
              currentCount + 1;
          }
        }

        return acc;
      },
      new Map<string, ActivityTrendData>()
    );

    return Array.from(trends.values()) as ActivityTrendData[];
  }

  // Overview Analytics - combines all analytics for dashboard
  async getOverviewAnalytics(
    organizationId: string,
    filters?: ActivityTrendsFilters
  ): Promise<OverviewAnalytics> {
    const [projects, teamPerformance, financial, clientInsights] =
      await Promise.all([
        this.getProjectAnalytics(organizationId, filters),
        this.getTeamPerformanceAnalytics(organizationId, filters),
        this.getFinancialAnalytics(organizationId, filters),
        this.getClientInsightsAnalytics(organizationId, filters),
      ]);

    return {
      projects,
      teamPerformance,
      financial,
      clientInsights,
    };
  }
}
