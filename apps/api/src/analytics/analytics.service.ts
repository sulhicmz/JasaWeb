import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { DateTime } from 'luxon';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

interface ProjectMetrics {
  projectId: string;
  organizationId: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  averageTaskDuration: number;
  budgetUtilization: number;
  timelineAdherence: number;
  teamProductivity: number;
  riskScore: number;
  clientSatisfactionPrediction: number;
}

interface AnalyticsFilters {
  dateRange?: { start: Date; end: Date };
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  tags?: string[];
}

interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

interface PredictiveMetrics {
  estimatedCompletion: Date;
  budgetOverrunRisk: number;
  timelineDelayRisk: number;
  qualityScore: number;
  recommendedActions: string[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly cache: CacheService
  ) {}

  // Project Analytics
  async getProjectAnalytics(
    organizationId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      projectId?: string;
    }
  ) {
    const whereClause: any = {
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

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        milestones: true,
        tasks: true,
        approvals: true,
        tickets: true,
        invoices: true,
      },
    });

    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p: any) => p.status === 'completed'
    ).length;
    const inProgressProjects = projects.filter(
      (p: any) => p.status === 'progress'
    ).length;
    const overdueProjects = projects.filter(
      (p: any) =>
        p.dueAt && new Date(p.dueAt) < new Date() && p.status !== 'completed'
    ).length;

    // Calculate milestone completion
    const totalMilestones = projects.reduce(
      (sum: number, p: any) => sum + p.milestones.length,
      0
    );
    const completedMilestones = projects.reduce(
      (sum: number, p: any) =>
        sum + p.milestones.filter((m: any) => m.status === 'completed').length,
      0
    );

    // Calculate task completion
    const totalTasks = projects.reduce(
      (sum: number, p: any) => sum + p.tasks.length,
      0
    );
    const completedTasks = projects.reduce(
      (sum: number, p: any) =>
        sum + p.tasks.filter((t: any) => t.status === 'completed').length,
      0
    );

    // Timeline adherence (projects completed on time)
    const completedOnTime = projects.filter(
      (p: any) =>
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
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    }
  ) {
    const whereClause: any = {
      memberships: {
        some: {
          organizationId,
        },
      },
    };

    if (filters?.userId) {
      whereClause.id = filters.userId;
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        memberships: {
          where: { organizationId },
        },
        Task: {
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
    });

    return users.map((user: any) => {
      const totalTasks = user.Task.length;
      const completedTasks = user.Task.filter(
        (t: any) => t.status === 'completed'
      ).length;
      const totalApprovals = user.approvals.length;
      const completedApprovals = user.approvals.filter(
        (a: any) => a.status !== 'pending'
      ).length;
      const totalTickets = user.tickets.length;
      const resolvedTickets = user.tickets.filter(
        (t: any) => t.status === 'resolved' || t.status === 'closed'
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
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      projectId?: string;
    }
  ) {
    const whereClause: any = {
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

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        project: true,
      },
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum: number, inv: any) => sum + inv.amount,
      0
    );
    const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
    const paidAmount = paidInvoices.reduce(
      (sum: number, inv: any) => sum + inv.amount,
      0
    );
    const overdueInvoices = invoices.filter(
      (inv: any) =>
        inv.status !== 'paid' &&
        inv.status !== 'cancelled' &&
        new Date(inv.dueAt) < new Date()
    );

    // Group by currency
    const byCurrency = invoices.reduce(
      (acc: any, inv: any) => {
        const currency = inv.currency;
        if (!acc[currency]) {
          acc[currency] = { count: 0, amount: 0, paid: 0 };
        }
        const currencyData = acc[currency]!;
        currencyData.count++;
        currencyData.amount += inv.amount;
        if (inv.status === 'paid') {
          currencyData.paid += inv.amount;
        }
        return acc;
      },
      {} as Record<string, { count: number; amount: number; paid: number }>
    );

    // Group by month
    const byMonth = invoices.reduce(
      (acc: any, inv: any) => {
        const month = DateTime.fromJSDate(inv.issuedAt).toFormat('yyyy-MM');
        if (!acc[month]) {
          acc[month] = { count: 0, amount: 0, paid: 0 };
        }
        acc[month].count++;
        acc[month].amount += inv.amount;
        if (inv.status === 'paid') {
          acc[month].paid += inv.amount;
        }
        return acc;
      },
      {} as Record<string, { count: number; amount: number; paid: number }>
    );

    return {
      summary: {
        totalInvoices,
        totalAmount,
        paidAmount,
        outstandingAmount: totalAmount - paidAmount,
        paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
        overdueCount: overdueInvoices.length,
      },
      byCurrency,
      byMonth,
    };
  }

  // Client Insights / SLA Analytics
  async getClientInsightsAnalytics(
    organizationId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ) {
    const whereClause: any = {
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

    const tickets = await this.prisma.ticket.findMany({
      where: whereClause,
      include: {
        assignee: true,
        project: true,
      },
    });

    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(
      (t: any) => t.status === 'resolved' || t.status === 'closed'
    );
    const resolvedCount = resolvedTickets.length;

    // Calculate average resolution time (simplified - in real implementation, track resolution time)
    const criticalTickets = tickets.filter(
      (t: any) => t.priority === 'critical'
    );
    const highTickets = tickets.filter((t: any) => t.priority === 'high');
    const mediumTickets = tickets.filter((t: any) => t.priority === 'medium');
    const lowTickets = tickets.filter((t: any) => t.priority === 'low');

    // SLA compliance (tickets resolved within SLA)
    const slaCompliantTickets = resolvedTickets.filter(
      (t: any) => !t.slaDueAt || t.updatedAt <= new Date(t.slaDueAt)
    ).length;

    // Group by type
    const byType = tickets.reduce(
      (acc: any, ticket: any) => {
        const type = ticket.type;
        if (!acc[type]) {
          acc[type] = { total: 0, resolved: 0 };
        }
        const typeData = acc[type]!;
        typeData.total++;
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
          typeData.resolved++;
        }
        return acc;
      },
      {} as Record<string, { total: number; resolved: number }>
    );

    // Group by priority
    const byPriority = {
      critical: {
        total: criticalTickets.length,
        resolved: criticalTickets.filter(
          (t: any) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
      high: {
        total: highTickets.length,
        resolved: highTickets.filter(
          (t: any) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
      medium: {
        total: mediumTickets.length,
        resolved: mediumTickets.filter(
          (t: any) => t.status === 'resolved' || t.status === 'closed'
        ).length,
      },
      low: {
        total: lowTickets.length,
        resolved: lowTickets.filter(
          (t: any) => t.status === 'resolved' || t.status === 'closed'
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
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      granularity?: 'day' | 'week' | 'month';
    }
  ) {
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
      (acc: any, log: any) => {
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

        if (!acc[key]) {
          acc[key] = {
            date: key,
            total: 0,
            user_login: 0,
            file_upload: 0,
            approval_request: 0,
            project_created: 0,
            task_completed: 0,
          };
        }

        acc[key].total++;
        if (acc[key][log.action] !== undefined) {
          acc[key][log.action]++;
        }

        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(trends);
  }

  // Advanced Project Metrics with Real-time Calculations
  async getProjectMetrics(
    projectId: string,
    organizationId: string,
    filters?: AnalyticsFilters
  ): Promise<ProjectMetrics> {
    const cacheKey = `analytics:project:${projectId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Verify project access
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        tasks: {
          where: this.buildTaskFilters(filters),
          include: {
            assignee: true,
          },
        },
        milestones: {
          where: filters?.status
            ? { status: { in: filters.status } }
            : undefined,
        },
        invoices: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const metrics = await this.calculateProjectMetrics(project);

    // Cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(metrics), 300);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.project_metrics_viewed',
      target: projectId,
      meta: { filters },
    });

    return metrics;
  }

  async getOrganizationAnalytics(
    organizationId: string,
    filters?: AnalyticsFilters
  ): Promise<{
    overview: {
      totalProjects: number;
      activeProjects: number;
      completedProjects: number;
      totalRevenue: number;
      averageProjectDuration: number;
      clientSatisfactionScore: number;
    };
    trends: {
      projectCompletion: TrendData[];
      revenue: TrendData[];
      teamProductivity: TrendData[];
    };
    topPerformers: Array<{
      userId: string;
      name: string;
      completedTasks: number;
      productivityScore: number;
    }>;
    riskAnalysis: {
      highRiskProjects: number;
      budgetOverruns: number;
      timelineDelays: number;
    };
  }> {
    const cacheKey = `analytics:org:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        ...this.buildProjectFilters(filters),
      },
      include: {
        tasks: {
          where: this.buildTaskFilters(filters),
          include: {
            assignee: true,
          },
        },
        milestones: true,
        invoices: true,
        organization: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const analytics = await this.calculateOrganizationAnalytics(
      projects,
      organizationId
    );

    // Cache for 10 minutes
    await this.cache.set(cacheKey, JSON.stringify(analytics), 600);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.organization_viewed',
      target: organizationId,
      meta: { filters },
    });

    return analytics;
  }

  async getPredictiveAnalytics(
    projectId: string,
    organizationId: string
  ): Promise<PredictiveMetrics> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        tasks: {
          include: {
            assignee: true,
          },
        },
        milestones: true,
        invoices: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const metrics = await this.calculateProjectMetrics(project);
    const predictions = this.generatePredictions(project, metrics);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.predictive_viewed',
      target: projectId,
      meta: { predictions },
    });

    return predictions;
  }

  private async calculateProjectMetrics(project: any): Promise<ProjectMetrics> {
    const tasks = project.tasks || [];
    const milestones = project.milestones || [];
    const invoices = project.invoices || [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'done'
    ).length;

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      (m) => m.status === 'completed'
    ).length;

    // Calculate average task duration (in days)
    const completedTasksWithDuration = tasks.filter(
      (t) => t.status === 'done' && t.createdAt && t.updatedAt
    );
    const averageTaskDuration =
      completedTasksWithDuration.length > 0
        ? completedTasksWithDuration.reduce((sum, task) => {
            const duration = Math.ceil(
              (new Date(task.updatedAt).getTime() -
                new Date(task.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + duration;
          }, 0) / completedTasksWithDuration.length
        : 0;

    // Calculate budget utilization
    const totalBudget = project.budget || 0;
    const totalSpent = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const budgetUtilization =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate timeline adherence
    const plannedDuration =
      project.startAt && project.dueAt
        ? Math.ceil(
            (new Date(project.dueAt).getTime() -
              new Date(project.startAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;
    const elapsedDays = project.startAt
      ? Math.ceil(
          (new Date().getTime() - new Date(project.startAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
    const expectedProgress =
      plannedDuration > 0 ? (elapsedDays / plannedDuration) * 100 : 0;
    const actualProgress =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const timelineAdherence =
      expectedProgress > 0 ? (actualProgress / expectedProgress) * 100 : 100;

    // Calculate team productivity (tasks completed per person per week)
    const teamSize = new Set(tasks.map((t) => t.assigneeId)).size || 1;
    const projectWeeks = Math.max(elapsedDays / 7, 1);
    const teamProductivity = completedTasks / teamSize / projectWeeks;

    // Calculate risk score (0-100, higher is riskier)
    const overdueTaskRisk = (overdueTasks / totalTasks) * 100;
    const budgetRisk =
      budgetUtilization > 100 ? (budgetUtilization - 100) * 2 : 0;
    const timelineRisk =
      timelineAdherence < 80 ? (80 - timelineAdherence) * 1.5 : 0;
    const riskScore = Math.min(
      100,
      overdueTaskRisk + budgetRisk + timelineRisk
    );

    // Predict client satisfaction based on various factors
    const onTimeDelivery =
      timelineAdherence >= 90 ? 30 : timelineAdherence >= 70 ? 20 : 0;
    const onBudgetDelivery =
      budgetUtilization <= 100 ? 25 : budgetUtilization <= 120 ? 10 : 0;
    const qualityScore = Math.min(25, (completedTasks / totalTasks) * 25);
    const communicationScore = 20; // Placeholder - could be based on response times
    const clientSatisfactionPrediction =
      onTimeDelivery + onBudgetDelivery + qualityScore + communicationScore;

    return {
      projectId: project.id,
      organizationId: project.organizationId,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalMilestones,
      completedMilestones,
      averageTaskDuration,
      budgetUtilization,
      timelineAdherence,
      teamProductivity,
      riskScore,
      clientSatisfactionPrediction,
    };
  }

  private async calculateOrganizationAnalytics(
    projects: any[],
    organizationId: string
  ) {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter(
      (p) => p.status === 'completed'
    ).length;

    const totalRevenue = projects.reduce((sum, project) => {
      return (
        sum +
        project.invoices
          .filter((i) => i.status === 'paid')
          .reduce(
            (invoiceSum, invoice) => invoiceSum + (invoice.amount || 0),
            0
          )
      );
    }, 0);

    // Calculate average project duration
    const completedProjectsWithDuration = projects.filter(
      (p) => p.status === 'completed' && p.startAt && p.dueAt
    );
    const averageProjectDuration =
      completedProjectsWithDuration.length > 0
        ? completedProjectsWithDuration.reduce((sum, project) => {
            const duration = Math.ceil(
              (new Date(project.dueAt).getTime() -
                new Date(project.startAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + duration;
          }, 0) / completedProjectsWithDuration.length
        : 0;

    // Calculate client satisfaction score (placeholder - would come from surveys)
    const clientSatisfactionScore = 85; // Placeholder

    // Generate trend data
    const trends = {
      projectCompletion: this.generateTrendData(projects, 'completion'),
      revenue: this.generateTrendData(projects, 'revenue'),
      teamProductivity: this.generateTrendData(projects, 'productivity'),
    };

    // Calculate top performers
    const allTasks = projects.flatMap((p) => p.tasks || []);
    const taskCountsByUser = allTasks.reduce((acc, task) => {
      if (task.assigneeId && task.status === 'done') {
        acc[task.assigneeId] = (acc[task.assigneeId] || 0) + 1;
      }
      return acc;
    }, {});

    const topPerformers = Object.entries(taskCountsByUser)
      .map(([userId, completedTasks]) => ({
        userId,
        name: `User ${userId}`, // Would get actual name from user service
        completedTasks: completedTasks as number,
        productivityScore: (completedTasks as number) * 10, // Simplified calculation
      }))
      .sort((a, b) => b.productivityScore - a.productivityScore)
      .slice(0, 5);

    // Risk analysis
    const highRiskProjects = projects.filter((p) => {
      const metrics = this.calculateProjectMetrics(p);
      return metrics.riskScore > 70;
    }).length;

    const budgetOverruns = projects.filter((p) => {
      const metrics = this.calculateProjectMetrics(p);
      return metrics.budgetUtilization > 100;
    }).length;

    const timelineDelays = projects.filter((p) => {
      const metrics = this.calculateProjectMetrics(p);
      return metrics.timelineAdherence < 80;
    }).length;

    return {
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalRevenue,
        averageProjectDuration,
        clientSatisfactionScore,
      },
      trends,
      topPerformers,
      riskAnalysis: {
        highRiskProjects,
        budgetOverruns,
        timelineDelays,
      },
    };
  }

  private generatePredictions(
    project: any,
    metrics: ProjectMetrics
  ): PredictiveMetrics {
    // Estimate completion based on current progress
    const completedTasks = metrics.completedTasks;
    const totalTasks = metrics.totalTasks;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    const daysSinceStart = project.startAt
      ? Math.ceil(
          (new Date().getTime() - new Date(project.startAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const estimatedTotalDays =
      completionRate > 0 ? daysSinceStart / completionRate : daysSinceStart * 2;
    const estimatedCompletion = new Date(
      Date.now() + (estimatedTotalDays - daysSinceStart) * 24 * 60 * 60 * 1000
    );

    // Calculate risks
    const budgetOverrunRisk = Math.max(
      0,
      Math.min(100, (metrics.budgetUtilization - 100) * 2)
    );
    const timelineDelayRisk = Math.max(
      0,
      Math.min(100, (100 - metrics.timelineAdherence) * 1.5)
    );

    // Quality score based on various factors
    const qualityScore = Math.max(
      0,
      Math.min(
        100,
        completionRate * 40 +
          (100 - metrics.riskScore) * 0.3 +
          metrics.teamProductivity * 10
      )
    );

    // Generate recommended actions
    const recommendedActions: string[] = [];
    if (metrics.overdueTasks > 0) {
      recommendedActions.push('Address overdue tasks immediately');
    }
    if (budgetOverrunRisk > 20) {
      recommendedActions.push('Review budget allocation and spending');
    }
    if (timelineDelayRisk > 30) {
      recommendedActions.push('Reassess project timeline and resources');
    }
    if (metrics.riskScore > 70) {
      recommendedActions.push('Conduct risk mitigation review');
    }
    if (recommendedActions.length === 0) {
      recommendedActions.push(
        'Project is on track - continue current approach'
      );
    }

    return {
      estimatedCompletion,
      budgetOverrunRisk,
      timelineDelayRisk,
      qualityScore,
      recommendedActions,
    };
  }

  private generateTrendData(projects: any[], type: string): TrendData[] {
    // Generate mock trend data for the last 6 months
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      let value = 0;
      let change = 0;

      switch (type) {
        case 'completion':
          value = Math.floor(Math.random() * 10) + 5;
          break;
        case 'revenue':
          value = Math.floor(Math.random() * 50000) + 10000;
          break;
        case 'productivity':
          value = Math.floor(Math.random() * 20) + 10;
          break;
      }

      if (trends.length > 0) {
        change = value - trends[trends.length - 1].value;
      }

      trends.push({
        period,
        value,
        change,
        changePercent:
          trends.length > 0
            ? (change / trends[trends.length - 1].value) * 100
            : 0,
      });
    }

    return trends;
  }

  private buildTaskFilters(filters?: AnalyticsFilters) {
    if (!filters) return undefined;

    const where: any = {};

    if (filters.status) {
      where.status = { in: filters.status };
    }

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  private buildProjectFilters(filters?: AnalyticsFilters) {
    if (!filters) return undefined;

    const where: any = {};

    if (filters.status) {
      where.status = { in: filters.status };
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  // Overview Analytics - combines all analytics for dashboard
  async getOverviewAnalytics(
    organizationId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ) {
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
