import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { MultiTenantPrismaService } from '../../common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';

export interface ProjectAnalyticsDto {
  projectId: string;
  organizationId: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  healthScore: number;
  performanceScore: number;
  budgetUtilization: number;
  timelineAdherence: number;
  teamProductivity: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  milestonesCompleted: number;
  milestonesTotal: number;
  ticketsResolved: number;
  ticketsOpen: number;
  avgResolutionTime: number;
  forecastedCompletion: Date;
  budgetVariance: number;
  teamVelocity: number;
  clientSatisfactionScore?: number;
  lastUpdated: Date;
}

export interface ProjectTrend {
  date: string;
  healthScore: number;
  progress: number;
  budgetBurn: number;
  teamCapacity: number;
}

export interface ProjectForecast {
  expectedCompletion: Date;
  confidence: number;
  riskFactors: string[];
  recommendedActions: string[];
  budgetProjection: number;
  timelineVariance: number;
}

export interface TeamProductivity {
  userId: string;
  userName: string;
  tasksCompleted: number;
  avgTaskDuration: number;
  contributionScore: number;
  availability: number;
  workload: 'optimal' | 'overloaded' | 'underutilized';
}

@Injectable()
export class ProjectAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly cacheManager: Cache
  ) {}

  async getProjectAnalytics(dto: ProjectAnalyticsDto): Promise<{
    metrics: ProjectMetrics;
    trends: ProjectTrend[];
    forecast: ProjectForecast;
    teamProductivity: TeamProductivity[];
    recommendations: string[];
  }> {
    const cacheKey = `project-analytics-${dto.projectId}-${dto.timeRange}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    const metrics = await this.calculateProjectMetrics(dto);
    const trends = await this.getProjectTrends(dto);
    const forecast = await this.generateProjectForecast(dto, metrics);
    const teamProductivity = await this.calculateTeamProductivity(dto);
    const recommendations = await this.generateRecommendations(
      metrics,
      forecast
    );

    const result = {
      metrics,
      trends,
      forecast,
      teamProductivity,
      recommendations,
    };

    // Cache for 15 minutes
    await this.cacheManager.set(cacheKey, result, 900);

    return result;
  }

  private async calculateProjectMetrics(
    dto: ProjectAnalyticsDto
  ): Promise<ProjectMetrics> {
    const { projectId, organizationId } = dto;

    // Get project data with related entities
    const project = await this.multiTenantPrisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        milestones: {
          include: {
            tasks: true,
          },
        },
        tickets: {
          where: {
            createdAt: {
              gte: this.getDateFromTimeRange(dto.timeRange),
            },
          },
        },
        invoices: {
          where: {
            createdAt: {
              gte: this.getDateFromTimeRange(dto.timeRange),
            },
          },
        },
        files: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate health score (0-100)
    const healthScore = this.calculateHealthScore(project);

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(project);

    // Calculate budget utilization
    const budgetUtilization = this.calculateBudgetUtilization(project);

    // Calculate timeline adherence
    const timelineAdherence = this.calculateTimelineAdherence(project);

    // Calculate team productivity
    const teamProductivity = this.calculateTeamProductivityScore(project);

    // Determine risk level
    const riskLevel = this.assessRiskLevel(
      healthScore,
      performanceScore,
      timelineAdherence
    );

    // Calculate forecasted completion
    const forecastedCompletion = this.calculateForecastedCompletion(project);

    // Calculate budget variance
    const budgetVariance = this.calculateBudgetVariance(project);

    // Calculate team velocity
    const teamVelocity = this.calculateTeamVelocity(project);

    return {
      projectId: project.id,
      projectName: project.name,
      healthScore,
      performanceScore,
      budgetUtilization,
      timelineAdherence,
      teamProductivity,
      riskLevel,
      milestonesCompleted: project.milestones.filter(
        (m) => m.status === 'completed'
      ).length,
      milestonesTotal: project.milestones.length,
      ticketsResolved: project.tickets.filter((t) => t.status === 'resolved')
        .length,
      ticketsOpen: project.tickets.filter((t) => t.status === 'open').length,
      avgResolutionTime: this.calculateAvgResolutionTime(project.tickets),
      forecastedCompletion,
      budgetVariance,
      teamVelocity,
      lastUpdated: new Date(),
    };
  }

  private calculateHealthScore(project: any): number {
    let score = 100;

    // Milestone completion impact (30%)
    const milestoneCompletion =
      project.milestones.length > 0
        ? project.milestones.filter((m) => m.status === 'completed').length /
          project.milestones.length
        : 1;
    score -= (1 - milestoneCompletion) * 30;

    // Ticket resolution impact (25%)
    const openTickets = project.tickets.filter(
      (t) => t.status === 'open'
    ).length;
    const overdueTickets = project.tickets.filter(
      (t) =>
        t.status === 'open' && t.slaDueAt && new Date(t.slaDueAt) < new Date()
    ).length;
    const ticketScore = Math.max(
      0,
      100 - overdueTickets * 20 - openTickets * 5
    );
    score = score * 0.75 + ticketScore * 0.25;

    // Timeline impact (25%)
    const delayedMilestones = project.milestones.filter(
      (m) =>
        m.dueAt && new Date(m.dueAt) < new Date() && m.status !== 'completed'
    ).length;
    score -= delayedMilestones * 15;

    // Budget impact (20%)
    const budgetVariance = Math.abs(this.calculateBudgetVariance(project));
    if (budgetVariance > 20) score -= 20;
    else if (budgetVariance > 10) score -= 10;
    else if (budgetVariance > 5) score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculatePerformanceScore(project: any): number {
    let score = 100;

    // Task completion rate
    const allTasks = project.milestones.flatMap((m) => m.tasks || []);
    const completedTasks = allTasks.filter(
      (t) => t.status === 'completed'
    ).length;
    const taskCompletionRate =
      allTasks.length > 0 ? completedTasks / allTasks.length : 1;
    score = score * 0.4 + taskCompletionRate * 60;

    // Ticket resolution time
    const avgResolutionTime = this.calculateAvgResolutionTime(project.tickets);
    if (avgResolutionTime > 72)
      score -= 25; // > 3 days
    else if (avgResolutionTime > 48)
      score -= 15; // > 2 days
    else if (avgResolutionTime > 24) score -= 5; // > 1 day

    // Milestone on-time completion
    const onTimeMilestones = project.milestones.filter(
      (m) =>
        m.status === 'completed' &&
        (!m.dueAt ||
          new Date(m.completedAt || m.updatedAt) <= new Date(m.dueAt))
    ).length;
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'completed'
    ).length;
    const onTimeRate =
      completedMilestones > 0 ? onTimeMilestones / completedMilestones : 1;
    score = score * 0.7 + onTimeRate * 30;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateBudgetUtilization(project: any): number {
    const totalBudget = project.budget || 0;
    if (totalBudget === 0) return 0;

    const totalSpent = project.invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  }

  private calculateTimelineAdherence(project: any): number {
    if (!project.dueAt) return 100;

    const now = new Date();
    const dueDate = new Date(project.dueAt);
    const startDate = project.startAt ? new Date(project.startAt) : now;

    const totalDuration = dueDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();

    const expectedProgress = Math.min(
      100,
      (elapsedDuration / totalDuration) * 100
    );

    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'completed'
    ).length;
    const totalMilestones = project.milestones.length;
    const actualProgress =
      totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    return Math.max(
      0,
      Math.min(100, Math.round((actualProgress / expectedProgress) * 100))
    );
  }

  private calculateTeamProductivityScore(project: any): number {
    const allTasks = project.milestones.flatMap((m) => m.tasks || []);
    const completedTasks = allTasks.filter(
      (t) => t.status === 'completed'
    ).length;

    if (allTasks.length === 0) return 100;

    // Calculate based on task completion rate and average resolution time
    const completionRate = completedTasks / allTasks.length;
    const avgResolutionTime = this.calculateAvgTaskResolutionTime(allTasks);

    let productivityScore = completionRate * 70;

    // Bonus for fast resolution
    if (avgResolutionTime < 24) productivityScore += 30;
    else if (avgResolutionTime < 48) productivityScore += 20;
    else if (avgResolutionTime < 72) productivityScore += 10;

    return Math.max(0, Math.min(100, Math.round(productivityScore)));
  }

  private assessRiskLevel(
    healthScore: number,
    performanceScore: number,
    timelineAdherence: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const avgScore = (healthScore + performanceScore + timelineAdherence) / 3;

    if (avgScore >= 80) return 'low';
    if (avgScore >= 60) return 'medium';
    if (avgScore >= 40) return 'high';
    return 'critical';
  }

  private calculateAvgResolutionTime(tickets: any[]): number {
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved' && t.resolvedAt
    );

    if (resolvedTickets.length === 0) return 0;

    const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt).getTime();
      const resolved = new Date(ticket.resolvedAt).getTime();
      return sum + (resolved - created);
    }, 0);

    return Math.round(
      totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60)
    ); // hours
  }

  private calculateAvgTaskResolutionTime(tasks: any[]): number {
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.completedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalResolutionTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime();
      const completed = new Date(task.completedAt).getTime();
      return sum + (completed - created);
    }, 0);

    return Math.round(
      totalResolutionTime / completedTasks.length / (1000 * 60 * 60)
    ); // hours
  }

  private calculateForecastedCompletion(project: any): Date {
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'completed'
    );
    const remainingMilestones = project.milestones.filter(
      (m) => m.status !== 'completed'
    );

    if (remainingMilestones.length === 0) {
      return new Date();
    }

    // Calculate average milestone completion time
    const avgCompletionTime =
      completedMilestones.length > 0
        ? completedMilestones.reduce((sum, m) => {
            const created = new Date(m.createdAt).getTime();
            const completed = new Date(m.completedAt || m.updatedAt).getTime();
            return sum + (completed - created);
          }, 0) / completedMilestones.length
        : 7 * 24 * 60 * 60 * 1000; // Default to 7 days

    const forecastedTime =
      Date.now() + remainingMilestones.length * avgCompletionTime;
    return new Date(forecastedTime);
  }

  private calculateBudgetVariance(project: any): number {
    const totalBudget = project.budget || 0;
    if (totalBudget === 0) return 0;

    const totalSpent = project.invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const projectedSpend =
      totalSpent +
      project.invoices
        .filter((i) => i.status === 'pending')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

    return Math.round(((projectedSpend - totalBudget) / totalBudget) * 100);
  }

  private calculateTeamVelocity(project: any): number {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentTasks = project.milestones
      .flatMap((m) => m.tasks || [])
      .filter(
        (t) =>
          new Date(t.completedAt || t.updatedAt) > last30Days &&
          t.status === 'completed'
      );

    return recentTasks.length;
  }

  private async getProjectTrends(
    dto: ProjectAnalyticsDto
  ): Promise<ProjectTrend[]> {
    const { projectId, organizationId, timeRange } = dto;
    const days = this.getDaysFromTimeRange(timeRange);
    const trends: ProjectTrend[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Calculate daily metrics (simplified for demo)
      const healthScore = 70 + Math.random() * 30; // Mock data
      const progress = Math.min(100, (days - i) * (100 / days));
      const budgetBurn = Math.random() * 100;
      const teamCapacity = 60 + Math.random() * 40;

      trends.push({
        date: dateStr,
        healthScore: Math.round(healthScore),
        progress: Math.round(progress),
        budgetBurn: Math.round(budgetBurn),
        teamCapacity: Math.round(teamCapacity),
      });
    }

    return trends;
  }

  private async generateProjectForecast(
    dto: ProjectAnalyticsDto,
    metrics: ProjectMetrics
  ): Promise<ProjectForecast> {
    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];

    // Assess risk factors
    if (metrics.healthScore < 50) {
      riskFactors.push('Low project health score');
      recommendedActions.push(
        'Review project milestones and reassign resources'
      );
    }

    if (metrics.timelineAdherence < 70) {
      riskFactors.push('Timeline delays detected');
      recommendedActions.push(
        'Adjust project schedule and prioritize critical tasks'
      );
    }

    if (metrics.budgetUtilization > 90) {
      riskFactors.push('Budget nearly depleted');
      recommendedActions.push(
        'Review budget allocation and consider additional funding'
      );
    }

    if (metrics.ticketsOpen > 10) {
      riskFactors.push('High number of open tickets');
      recommendedActions.push(
        'Increase team capacity or improve ticket resolution process'
      );
    }

    const confidence = Math.max(0, Math.min(100, metrics.healthScore));
    const expectedCompletion = metrics.forecastedCompletion;
    const budgetProjection = metrics.budgetUtilization * 1.1; // 10% buffer
    const timelineVariance = 100 - metrics.timelineAdherence;

    return {
      expectedCompletion,
      confidence: Math.round(confidence),
      riskFactors,
      recommendedActions,
      budgetProjection: Math.round(budgetProjection),
      timelineVariance: Math.round(timelineVariance),
    };
  }

  private async calculateTeamProductivity(
    dto: ProjectAnalyticsDto
  ): Promise<TeamProductivity[]> {
    // Mock team productivity data
    return [
      {
        userId: 'user1',
        userName: 'John Doe',
        tasksCompleted: 15,
        avgTaskDuration: 4.5,
        contributionScore: 85,
        availability: 80,
        workload: 'optimal',
      },
      {
        userId: 'user2',
        userName: 'Jane Smith',
        tasksCompleted: 12,
        avgTaskDuration: 3.2,
        contributionScore: 78,
        availability: 90,
        workload: 'optimal',
      },
    ];
  }

  private async generateRecommendations(
    metrics: ProjectMetrics,
    forecast: ProjectForecast
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.healthScore < 70) {
      recommendations.push('Schedule project health review with stakeholders');
    }

    if (metrics.performanceScore < 60) {
      recommendations.push(
        'Consider adding additional resources to critical path tasks'
      );
    }

    if (metrics.timelineAdherence < 80) {
      recommendations.push(
        'Review and optimize project workflow and dependencies'
      );
    }

    if (metrics.teamProductivity < 70) {
      recommendations.push(
        'Provide team training and remove productivity blockers'
      );
    }

    if (forecast.riskFactors.length > 2) {
      recommendations.push('Implement risk mitigation strategies immediately');
    }

    return recommendations;
  }

  private getDateFromTimeRange(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      case '1y':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        now.setDate(now.getDate() - 30);
    }
    return now;
  }

  private getDaysFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }
}
