import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';
import { ProjectAnalyticsDto } from './dto/analytics.dto';

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  averageCompletionTime: number;
  onTimeDeliveryRate: number;
  clientSatisfactionScore: number;
  budgetUtilization: number;
}

export interface ProjectPerformanceInsights {
  productivityTrend: 'increasing' | 'decreasing' | 'stable';
  riskFactors: string[];
  recommendations: string[];
  teamWorkload: {
    userId: string;
    userName: string;
    activeTasks: number;
    workloadPercentage: number;
    efficiency: number;
  }[];
  milestoneProgress: {
    onTime: number;
    delayed: number;
    upcoming: number;
    completed: number;
  };
}

export interface ProjectTimelineData {
  projectId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  milestones: {
    id: string;
    title: string;
    dueDate: Date;
    completedDate?: Date;
    status: string;
    dependencies: string[];
  }[];
  criticalPath: string[];
  bufferTime: number;
}

export interface ProjectHealthScore {
  projectId: string;
  overallScore: number;
  scheduleHealth: number;
  budgetHealth: number;
  qualityHealth: number;
  teamHealth: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    category: string;
    impact: number;
    description: string;
  }[];
}

@Injectable()
export class ProjectAnalyticsService {
  private readonly logger = new Logger(ProjectAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly cacheManager: Cache
  ) {}

  async getProjectMetrics(organizationId: string): Promise<ProjectMetrics> {
    const cacheKey = `project-metrics-${organizationId}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<ProjectMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const db = this.multiTenantPrisma.getClient(organizationId);

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      avgCompletionTime,
      onTimeProjects,
      clientSatisfaction,
      budgetData,
    ] = await Promise.all([
      db.project.count(),
      db.project.count({ where: { status: 'ACTIVE' } }),
      db.project.count({ where: { status: 'COMPLETED' } }),
      this.getOverdueProjectsCount(organizationId),
      this.getAverageCompletionTime(organizationId),
      this.getOnTimeProjectsCount(organizationId),
      this.getClientSatisfactionScore(organizationId),
      this.getBudgetUtilization(organizationId),
    ]);

    const totalCompleted = completedProjects;
    const onTimeDeliveryRate =
      totalCompleted > 0 ? (onTimeProjects / totalCompleted) * 100 : 0;

    const metrics: ProjectMetrics = {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      averageCompletionTime: avgCompletionTime,
      onTimeDeliveryRate,
      clientSatisfactionScore: clientSatisfaction,
      budgetUtilization: budgetData,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, metrics, 300000);

    return metrics;
  }

  async getProjectPerformanceInsights(
    organizationId: string
  ): Promise<ProjectPerformanceInsights> {
    const cacheKey = `project-insights-${organizationId}`;

    const cached =
      await this.cacheManager.get<ProjectPerformanceInsights>(cacheKey);
    if (cached) {
      return cached;
    }

    const db = this.multiTenantPrisma.getClient(organizationId);

    // Get productivity trend (based on milestone completion rate over last 30 days)
    const productivityTrend =
      await this.calculateProductivityTrend(organizationId);

    // Identify risk factors
    const riskFactors = await this.identifyRiskFactors(organizationId);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskFactors);

    // Get team workload data
    const teamWorkload = await this.getTeamWorkload(organizationId);

    // Get milestone progress summary
    const milestoneProgress =
      await this.getMilestoneProgressSummary(organizationId);

    const insights: ProjectPerformanceInsights = {
      productivityTrend,
      riskFactors,
      recommendations,
      teamWorkload,
      milestoneProgress,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, insights, 600000);

    return insights;
  }

  async getProjectTimelineData(
    organizationId: string,
    projectId?: string
  ): Promise<ProjectTimelineData[]> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const projects = await db.project.findMany({
      where: projectId ? { id: projectId } : {},
      include: {
        milestones: {
          include: {
            dependencies: true,
          },
          orderBy: {
            dueAt: 'asc',
          },
        },
      },
    });

    return projects.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      startDate: project.createdAt,
      endDate: project.dueAt || new Date(),
      milestones: (project as any).milestones?.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        dueDate: milestone.dueAt,
        completedDate: milestone.completedAt,
        status: milestone.status,
        dependencies: milestone.dependencies.map(
          (dep: any) => dep.dependencyId
        ),
      })),
      criticalPath: this.calculateCriticalPath(
        (project as any).milestones || []
      ),
      bufferTime: this.calculateBufferTime((project as any).milestones || []),
    }));
  }

  async getProjectHealthScores(
    organizationId: string
  ): Promise<ProjectHealthScore[]> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const projects = await db.project.findMany({
      where: { status: 'ACTIVE' },
      include: {
        milestones: true,
        tickets: true,
        invoices: true,
      },
    });

    return Promise.all(
      projects.map((project: any) =>
        this.calculateProjectHealthScore(project, organizationId)
      )
    );
  }

  async getRealTimeProjectUpdates(organizationId: string): Promise<any> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const recentUpdates = await Promise.all([
      // Recent milestone completions
      db.milestone.findMany({
        where: {
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        include: { project: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      // Recent ticket updates
      db.ticket.findMany({
        where: {
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        include: { project: true, assignee: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      // Recent file uploads
      db.file.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        include: { project: true, uploadedBy: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      milestones: recentUpdates[0],
      tickets: recentUpdates[1],
      files: recentUpdates[2],
      timestamp: new Date(),
    };
  }

  private async getOverdueProjectsCount(
    organizationId: string
  ): Promise<number> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    return db.project.count({
      where: {
        dueAt: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
    });
  }

  private async getAverageCompletionTime(
    organizationId: string
  ): Promise<number> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const completedProjects = await db.project.findMany({
      where: { status: 'COMPLETED' },
      select: { createdAt: true, updatedAt: true },
    });

    if (completedProjects.length === 0) return 0;

    const totalDays = completedProjects.reduce((sum: number, project: any) => {
      const days = Math.ceil(
        (project.updatedAt.getTime() - project.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedProjects.length);
  }

  private async getOnTimeProjectsCount(
    organizationId: string
  ): Promise<number> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const completedProjects = await db.project.findMany({
      where: { status: 'COMPLETED' },
      select: { dueAt: true, updatedAt: true },
    });

    return completedProjects.filter(
      (project) => project.dueAt && project.updatedAt <= project.dueAt
    ).length;
  }

  private async getClientSatisfactionScore(
    organizationId: string
  ): Promise<number> {
    // This would typically come from client feedback/ratings
    // For now, return a mock score based on project completion rates
    const metrics = await this.getProjectMetrics(organizationId);
    const onTimeRate = metrics.onTimeDeliveryRate;

    // Base score on on-time delivery, with some randomness for demo
    return Math.min(
      10,
      Math.round((onTimeRate / 100) * 10 + Math.random() * 2)
    );
  }

  private async getBudgetUtilization(organizationId: string): Promise<number> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    // This would typically involve actual budget data
    // For now, return a mock percentage
    return Math.round(70 + Math.random() * 25); // 70-95% utilization
  }

  private async calculateProductivityTrend(
    organizationId: string
  ): Promise<'increasing' | 'decreasing' | 'stable'> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [recentMilestones, olderMilestones] = await Promise.all([
      db.milestone.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: thirtyDaysAgo },
        },
      }),
      db.milestone.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    if (recentMilestones > olderMilestones * 1.1) return 'increasing';
    if (recentMilestones < olderMilestones * 0.9) return 'decreasing';
    return 'stable';
  }

  private async identifyRiskFactors(organizationId: string): Promise<string[]> {
    const db = this.multiTenantPrisma.getClient(organizationId);
    const risks: string[] = [];

    // Check for overdue projects
    const overdueCount = await this.getOverdueProjectsCount(organizationId);
    if (overdueCount > 0) {
      risks.push(`${overdueCount} projects overdue`);
    }

    // Check for high-priority tickets
    const highPriorityTickets = await db.ticket.count({
      where: { priority: 'HIGH', status: { not: 'CLOSED' } },
    });
    if (highPriorityTickets > 5) {
      risks.push(`${highPriorityTickets} high-priority tickets open`);
    }

    // Check for stuck milestones
    const stuckMilestones = await db.milestone.count({
      where: {
        status: { not: 'COMPLETED' },
        dueAt: { lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Due in next 7 days
      },
    });
    if (stuckMilestones > 3) {
      risks.push(`${stuckMilestones} milestones at risk`);
    }

    return risks;
  }

  private generateRecommendations(riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (riskFactors.some((risk) => risk.includes('overdue'))) {
      recommendations.push('Review project timelines and adjust deadlines');
      recommendations.push(
        'Consider reallocating resources to delayed projects'
      );
    }

    if (riskFactors.some((risk) => risk.includes('tickets'))) {
      recommendations.push('Address high-priority tickets immediately');
      recommendations.push(
        'Review ticket assignment and workload distribution'
      );
    }

    if (riskFactors.some((risk) => risk.includes('milestones'))) {
      recommendations.push('Schedule milestone review meetings');
      recommendations.push('Update project stakeholders on potential delays');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current project management practices');
      recommendations.push('Monitor team workload and project progress');
    }

    return recommendations;
  }

  private async getTeamWorkload(organizationId: string): Promise<any[]> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    // Get users with their assigned tasks/tickets
    const users = await db.user.findMany({
      include: {
        assignedTickets: {
          where: { status: { not: 'CLOSED' } },
        },
        projects: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    return users.map((user: any) => ({
      userId: user.id,
      userName: user.name,
      activeTasks: user.assignedTickets.length,
      workloadPercentage: Math.min(
        100,
        (user.assignedTickets.length / 10) * 100
      ), // Assume 10 tasks = 100%
      efficiency: 0.8 + Math.random() * 0.2, // Mock efficiency score
    }));
  }

  private async getMilestoneProgressSummary(
    organizationId: string
  ): Promise<any> {
    const db = this.multiTenantPrisma.getClient(organizationId);

    const [onTime, delayed, upcoming, completed] = await Promise.all([
      db.milestone.count({
        where: {
          status: 'COMPLETED',
          completedAt: { lte: new Date() }, // Simplified for now
        },
      }),
      db.milestone.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gt: new Date() }, // Simplified for now
        },
      }),
      db.milestone.count({
        where: {
          status: { not: 'COMPLETED' },
          dueAt: { gte: new Date() },
        },
      }),
      db.milestone.count({
        where: { status: 'COMPLETED' },
      }),
    ]);

    return { onTime, delayed, upcoming, completed };
  }

  private calculateCriticalPath(milestones: any[]): string[] {
    // Simplified critical path calculation
    // In a real implementation, this would use proper CPM algorithm
    return milestones
      .filter((m) => m.dependencies.length === 0)
      .map((m) => m.id);
  }

  private calculateBufferTime(milestones: any[]): number {
    // Calculate average buffer time between milestones
    if (milestones.length < 2) return 0;

    const sortedMilestones = milestones.sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );

    let totalBuffer = 0;
    for (let i = 1; i < sortedMilestones.length; i++) {
      const prev = sortedMilestones[i - 1];
      const curr = sortedMilestones[i];
      const timeDiff =
        new Date(curr.dueAt).getTime() - new Date(prev.dueAt).getTime();
      totalBuffer += timeDiff;
    }

    return Math.round(
      totalBuffer / (milestones.length - 1) / (1000 * 60 * 60 * 24)
    ); // Days
  }

  private async calculateProjectHealthScore(
    project: any,
    organizationId: string
  ): Promise<ProjectHealthScore> {
    const factors: any[] = [];
    let scheduleHealth = 100;
    let budgetHealth = 100;
    let qualityHealth = 100;
    let teamHealth = 100;

    // Schedule health based on milestones
    const overdueMilestones = project.milestones.filter(
      (m: any) => new Date(m.dueAt) < new Date() && m.status !== 'COMPLETED'
    ).length;

    if (overdueMilestones > 0) {
      scheduleHealth = Math.max(0, 100 - overdueMilestones * 20);
      factors.push({
        category: 'Schedule',
        impact: -overdueMilestones * 20,
        description: `${overdueMilestones} overdue milestones`,
      });
    }

    // Budget health (mock calculation)
    budgetHealth = 85 + Math.random() * 15;

    // Quality health based on tickets
    const openTickets = project.tickets.filter(
      (t: any) => t.status !== 'CLOSED'
    ).length;
    if (openTickets > 5) {
      qualityHealth = Math.max(0, 100 - openTickets * 5);
      factors.push({
        category: 'Quality',
        impact: -openTickets * 5,
        description: `${openTickets} open tickets`,
      });
    }

    // Team health (mock calculation)
    teamHealth = 80 + Math.random() * 20;

    const overallScore = Math.round(
      (scheduleHealth + budgetHealth + qualityHealth + teamHealth) / 4
    );

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (overallScore < 60) riskLevel = 'critical';
    else if (overallScore < 70) riskLevel = 'high';
    else if (overallScore < 85) riskLevel = 'medium';

    return {
      projectId: project.id,
      overallScore,
      scheduleHealth,
      budgetHealth,
      qualityHealth,
      teamHealth,
      riskLevel,
      factors,
    };
  }
}
