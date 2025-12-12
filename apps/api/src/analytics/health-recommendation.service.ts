import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { MultiTenantPrismaService } from '../../common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';

export interface HealthRecommendationDto {
  projectId: string;
  organizationId: string;
}

export interface HealthRecommendation {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'timeline' | 'budget' | 'quality' | 'team' | 'risk' | 'process';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  actionable: boolean;
  dueDate?: Date;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomatedInsights {
  overallHealth: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trendDirection: 'improving' | 'stable' | 'declining';
  keyFindings: string[];
  immediateActions: HealthRecommendation[];
  quickWins: HealthRecommendation[];
  longTermImprovements: HealthRecommendation[];
  preventiveMeasures: HealthRecommendation[];
}

@Injectable()
export class HealthRecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly cacheManager: Cache
  ) {}

  async generateHealthRecommendations(
    dto: HealthRecommendationDto
  ): Promise<AutomatedInsights> {
    const cacheKey = `health-recommendations-${dto.projectId}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Get project data for analysis
    const project = await this.multiTenantPrisma.project.findFirst({
      where: {
        id: dto.projectId,
        organizationId: dto.organizationId,
      },
      include: {
        milestones: {
          include: {
            tasks: true,
          },
        },
        tickets: true,
        invoices: true,
        files: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Analyze project health
    const healthAnalysis = await this.analyzeProjectHealth(project);

    // Generate recommendations based on analysis
    const recommendations = await this.generateRecommendations(
      healthAnalysis,
      project
    );

    // Categorize recommendations
    const categorizedRecommendations =
      this.categorizeRecommendations(recommendations);

    const insights: AutomatedInsights = {
      overallHealth: healthAnalysis.overallHealth,
      riskLevel: healthAnalysis.riskLevel,
      trendDirection: healthAnalysis.trendDirection,
      keyFindings: healthAnalysis.keyFindings,
      immediateActions: categorizedRecommendations.immediateActions,
      quickWins: categorizedRecommendations.quickWins,
      longTermImprovements: categorizedRecommendations.longTermImprovements,
      preventiveMeasures: categorizedRecommendations.preventiveMeasures,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, insights, 300);

    return insights;
  }

  private async analyzeProjectHealth(project: any): Promise<{
    overallHealth: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    trendDirection: 'improving' | 'stable' | 'declining';
    keyFindings: string[];
    healthFactors: {
      timeline: number;
      budget: number;
      quality: number;
      team: number;
      risk: number;
    };
  }> {
    // Calculate health factors
    const timelineHealth = this.calculateTimelineHealth(project);
    const budgetHealth = this.calculateBudgetHealth(project);
    const qualityHealth = this.calculateQualityHealth(project);
    const teamHealth = this.calculateTeamHealth(project);
    const riskHealth = this.calculateRiskHealth(project);

    const overallHealth = Math.round(
      (timelineHealth +
        budgetHealth +
        qualityHealth +
        teamHealth +
        riskHealth) /
        5
    );

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overallHealth >= 80) {
      riskLevel = 'low';
    } else if (overallHealth >= 60) {
      riskLevel = 'medium';
    } else if (overallHealth >= 40) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }

    // Analyze trend direction (simplified)
    const recentTickets = project.tickets.filter(
      (t) =>
        new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const previousTickets = project.tickets.filter((t) => {
      const date = new Date(t.createdAt);
      return (
        date > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
        date <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
    }).length;

    let trendDirection: 'improving' | 'stable' | 'declining';
    if (recentTickets < previousTickets * 0.8) {
      trendDirection = 'improving';
    } else if (recentTickets > previousTickets * 1.2) {
      trendDirection = 'declining';
    } else {
      trendDirection = 'stable';
    }

    // Generate key findings
    const keyFindings = this.generateKeyFindings({
      overallHealth,
      timelineHealth,
      budgetHealth,
      qualityHealth,
      teamHealth,
      riskHealth,
      project,
    });

    return {
      overallHealth,
      riskLevel,
      trendDirection,
      keyFindings,
      healthFactors: {
        timeline: timelineHealth,
        budget: budgetHealth,
        quality: qualityHealth,
        team: teamHealth,
        risk: riskHealth,
      },
    };
  }

  private calculateTimelineHealth(project: any): number {
    let score = 100;

    // Check milestone completion
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'completed'
    ).length;
    const totalMilestones = project.milestones.length;
    const completionRate =
      totalMilestones > 0 ? completedMilestones / totalMilestones : 1;
    score = score * 0.4 + completionRate * 60;

    // Check overdue milestones
    const overdueMilestones = project.milestones.filter(
      (m) =>
        m.dueAt && new Date(m.dueAt) < new Date() && m.status !== 'completed'
    ).length;
    score -= overdueMilestones * 15;

    // Check if project is on schedule
    if (project.dueAt) {
      const now = new Date();
      const dueDate = new Date(project.dueAt);
      const progress = completionRate;
      const timeProgress =
        (now.getTime() - new Date(project.createdAt || now).getTime()) /
        (dueDate.getTime() - new Date(project.createdAt || now).getTime());

      if (progress < timeProgress * 0.8) {
        score -= 20;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateBudgetHealth(project: any): number {
    const totalBudget = project.budget || 0;
    if (totalBudget === 0) return 100;

    const spentAmount = project.invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const utilization = (spentAmount / totalBudget) * 100;

    let score = 100;
    if (utilization > 100) {
      score = 0;
    } else if (utilization > 90) {
      score = 30;
    } else if (utilization > 80) {
      score = 60;
    } else if (utilization > 70) {
      score = 80;
    }

    return score;
  }

  private calculateQualityHealth(project: any): number {
    let score = 100;

    // Check ticket resolution rate
    const resolvedTickets = project.tickets.filter(
      (t) => t.status === 'resolved'
    ).length;
    const totalTickets = project.tickets.length;
    const resolutionRate =
      totalTickets > 0 ? resolvedTickets / totalTickets : 1;
    score = score * 0.5 + resolutionRate * 50;

    // Check high-priority tickets
    const highPriorityTickets = project.tickets.filter(
      (t) => t.priority === 'high' && t.status === 'open'
    ).length;
    score -= highPriorityTickets * 10;

    // Check overdue tickets
    const overdueTickets = project.tickets.filter(
      (t) =>
        t.status === 'open' && t.slaDueAt && new Date(t.slaDueAt) < new Date()
    ).length;
    score -= overdueTickets * 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateTeamHealth(project: any): number {
    // Mock team health calculation
    // In a real implementation, this would consider team workload, availability, etc.
    let score = 75;

    // Adjust based on ticket volume
    const openTickets = project.tickets.filter(
      (t) => t.status === 'open'
    ).length;
    if (openTickets > 20) {
      score -= 20;
    } else if (openTickets > 10) {
      score -= 10;
    }

    // Adjust based on recent activity
    const recentActivity = project.tickets.filter(
      (t) =>
        new Date(t.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    if (recentActivity > 15) {
      score += 10; // High activity is good
    } else if (recentActivity < 5) {
      score -= 10; // Low activity might indicate issues
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateRiskHealth(project: any): number {
    let score = 100;

    // Timeline risk
    const overdueMilestones = project.milestones.filter(
      (m) =>
        m.dueAt && new Date(m.dueAt) < new Date() && m.status !== 'completed'
    ).length;
    score -= overdueMilestones * 20;

    // Budget risk
    const totalBudget = project.budget || 0;
    if (totalBudget > 0) {
      const spentAmount = project.invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      const utilization = (spentAmount / totalBudget) * 100;

      if (utilization > 90) {
        score -= 25;
      } else if (utilization > 80) {
        score -= 15;
      }
    }

    // Quality risk
    const highPriorityOpenTickets = project.tickets.filter(
      (t) => t.priority === 'high' && t.status === 'open'
    ).length;
    score -= highPriorityOpenTickets * 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateKeyFindings(analysis: any): string[] {
    const findings: string[] = [];

    if (analysis.overallHealth >= 80) {
      findings.push(
        '🎯 Project is performing excellently across all key metrics'
      );
    } else if (analysis.overallHealth >= 60) {
      findings.push(
        '📈 Project is performing well with opportunities for improvement'
      );
    } else {
      findings.push(
        '⚠️ Project requires immediate attention to address critical issues'
      );
    }

    if (analysis.healthFactors.timeline < 70) {
      findings.push(
        '📅 Timeline performance needs improvement - consider resource reallocation'
      );
    }

    if (analysis.healthFactors.budget < 70) {
      findings.push(
        '💰 Budget management requires attention - monitor spending closely'
      );
    }

    if (analysis.healthFactors.quality < 70) {
      findings.push(
        '🔍 Quality metrics are below target - focus on issue resolution'
      );
    }

    if (analysis.healthFactors.team < 70) {
      findings.push(
        '👥 Team productivity could be optimized - review workload distribution'
      );
    }

    if (analysis.healthFactors.risk < 70) {
      findings.push(
        '🚨 Risk factors identified - implement mitigation strategies'
      );
    }

    return findings;
  }

  private async generateRecommendations(
    healthAnalysis: any,
    project: any
  ): Promise<HealthRecommendation[]> {
    const recommendations: HealthRecommendation[] = [];

    // Timeline recommendations
    if (healthAnalysis.healthFactors.timeline < 70) {
      recommendations.push({
        id: 'timeline-1',
        type:
          healthAnalysis.healthFactors.timeline < 50 ? 'critical' : 'warning',
        category: 'timeline',
        title: 'Address Timeline Delays',
        description:
          'Project is behind schedule. Review milestone dependencies and consider resource reallocation.',
        impact: 'high',
        effort: 'medium',
        priority: 1,
        actionable: true,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Budget recommendations
    if (healthAnalysis.healthFactors.budget < 70) {
      recommendations.push({
        id: 'budget-1',
        type: healthAnalysis.healthFactors.budget < 50 ? 'critical' : 'warning',
        category: 'budget',
        title: 'Optimize Budget Utilization',
        description:
          'Budget utilization is high. Review spending patterns and identify cost-saving opportunities.',
        impact: 'high',
        effort: 'medium',
        priority: 2,
        actionable: true,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Quality recommendations
    if (healthAnalysis.healthFactors.quality < 70) {
      recommendations.push({
        id: 'quality-1',
        type:
          healthAnalysis.healthFactors.quality < 50 ? 'critical' : 'warning',
        category: 'quality',
        title: 'Improve Quality Metrics',
        description:
          'Quality metrics are below target. Focus on resolving high-priority tickets and improving processes.',
        impact: 'medium',
        effort: 'low',
        priority: 3,
        actionable: true,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Team recommendations
    if (healthAnalysis.healthFactors.team < 70) {
      recommendations.push({
        id: 'team-1',
        type: 'info',
        category: 'team',
        title: 'Enhance Team Productivity',
        description:
          'Team productivity can be improved. Consider workload balancing and skill development.',
        impact: 'medium',
        effort: 'medium',
        priority: 4,
        actionable: true,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Process improvement recommendations
    recommendations.push({
      id: 'process-1',
      type: 'info',
      category: 'process',
      title: 'Implement Regular Health Checks',
      description:
        'Establish weekly project health reviews to proactively identify and address issues.',
      impact: 'medium',
      effort: 'low',
      priority: 5,
      actionable: true,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Preventive measures
    if (healthAnalysis.trendDirection === 'declining') {
      recommendations.push({
        id: 'preventive-1',
        type: 'warning',
        category: 'risk',
        title: 'Address Declining Trend',
        description:
          'Project metrics are declining. Take corrective action to prevent further deterioration.',
        impact: 'high',
        effort: 'high',
        priority: 1,
        actionable: true,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  private categorizeRecommendations(recommendations: HealthRecommendation[]): {
    immediateActions: HealthRecommendation[];
    quickWins: HealthRecommendation[];
    longTermImprovements: HealthRecommendation[];
    preventiveMeasures: HealthRecommendation[];
  } {
    return {
      immediateActions: recommendations.filter(
        (r) =>
          r.type === 'critical' || (r.type === 'warning' && r.impact === 'high')
      ),
      quickWins: recommendations.filter(
        (r) => r.effort === 'low' && r.impact !== 'low'
      ),
      longTermImprovements: recommendations.filter(
        (r) => r.effort === 'high' || r.category === 'process'
      ),
      preventiveMeasures: recommendations.filter(
        (r) => r.category === 'risk' || r.category === 'process'
      ),
    };
  }
}
