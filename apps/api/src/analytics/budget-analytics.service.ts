import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { MultiTenantPrismaService } from '../../common/database/multi-tenant-prisma.service';
import { Cache } from 'cache-manager';

export interface BudgetAnalyticsDto {
  projectId: string;
  organizationId: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
}

export interface BudgetMetrics {
  projectId: string;
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  budgetUtilization: number;
  projectedSpend: number;
  budgetVariance: number;
  burnRate: number;
  estimatedDaysRemaining: number;
  costEfficiency: number;
  budgetHealth: 'healthy' | 'warning' | 'critical';
  monthlySpend: number;
  weeklySpend: number;
  dailySpend: number;
  largestExpenseCategory: string;
  budgetTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface BudgetForecast {
  expectedOverrun: number;
  overrunProbability: number;
  recommendedBudgetAdjustment: number;
  costSavingOpportunities: string[];
  riskFactors: string[];
  projectedCompletion: number;
  confidence: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

@Injectable()
export class BudgetAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly cacheManager: Cache
  ) {}

  async getBudgetAnalytics(dto: BudgetAnalyticsDto): Promise<{
    metrics: BudgetMetrics;
    forecast: BudgetForecast;
    expenseBreakdown: ExpenseBreakdown[];
    recommendations: string[];
  }> {
    const cacheKey = `budget-analytics-${dto.projectId}-${dto.timeRange}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    const metrics = await this.calculateBudgetMetrics(dto);
    const forecast = await this.generateBudgetForecast(dto, metrics);
    const expenseBreakdown = await this.getExpenseBreakdown(dto);
    const recommendations = await this.generateBudgetRecommendations(
      metrics,
      forecast
    );

    const result = {
      metrics,
      forecast,
      expenseBreakdown,
      recommendations,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600);

    return result;
  }

  private async calculateBudgetMetrics(
    dto: BudgetAnalyticsDto
  ): Promise<BudgetMetrics> {
    const { projectId, organizationId } = dto;

    // Get project with financial data
    const project = await this.multiTenantPrisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        invoices: {
          where: {
            createdAt: {
              gte: this.getDateFromTimeRange(dto.timeRange),
            },
          },
        },
        milestones: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const totalBudget = project.budget || 0;
    const spentAmount = project.invoices
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const pendingAmount = project.invoices
      .filter((invoice) => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const remainingBudget = totalBudget - spentAmount;
    const budgetUtilization =
      totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
    const projectedSpend = spentAmount + pendingAmount;
    const budgetVariance =
      totalBudget > 0
        ? ((projectedSpend - totalBudget) / totalBudget) * 100
        : 0;

    // Calculate burn rate (daily average spend)
    const daysSinceStart = project.startAt
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(project.startAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 30;
    const burnRate = spentAmount / daysSinceStart;

    // Estimate days remaining at current burn rate
    const estimatedDaysRemaining =
      burnRate > 0 ? Math.floor(remainingBudget / burnRate) : 999;

    // Calculate cost efficiency (budget vs progress)
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'completed'
    ).length;
    const totalMilestones = project.milestones.length;
    const progressPercentage =
      totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    const costEfficiency =
      progressPercentage > 0 ? budgetUtilization / progressPercentage : 1;

    // Determine budget health
    let budgetHealth: 'healthy' | 'warning' | 'critical';
    if (budgetVariance > 20) {
      budgetHealth = 'critical';
    } else if (budgetVariance > 10 || budgetUtilization > 85) {
      budgetHealth = 'warning';
    } else {
      budgetHealth = 'healthy';
    }

    // Calculate time-based spend
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const monthlySpend = project.invoices
      .filter(
        (invoice) =>
          new Date(invoice.createdAt) >= thirtyDaysAgo &&
          invoice.status === 'paid'
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const weeklySpend = project.invoices
      .filter(
        (invoice) =>
          new Date(invoice.createdAt) >= sevenDaysAgo &&
          invoice.status === 'paid'
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const dailySpend = project.invoices
      .filter(
        (invoice) =>
          new Date(invoice.createdAt) >= oneDayAgo && invoice.status === 'paid'
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    // Determine budget trend
    const recentSpend = weeklySpend;
    const previousWeekSpend = project.invoices
      .filter((invoice) => {
        const date = new Date(invoice.createdAt);
        return (
          date >= new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
          date < sevenDaysAgo &&
          invoice.status === 'paid'
        );
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    let budgetTrend: 'increasing' | 'decreasing' | 'stable';
    if (recentSpend > previousWeekSpend * 1.1) {
      budgetTrend = 'increasing';
    } else if (recentSpend < previousWeekSpend * 0.9) {
      budgetTrend = 'decreasing';
    } else {
      budgetTrend = 'stable';
    }

    return {
      projectId: project.id,
      totalBudget,
      spentAmount,
      remainingBudget,
      budgetUtilization: Math.round(budgetUtilization),
      projectedSpend,
      budgetVariance: Math.round(budgetVariance),
      burnRate: Math.round(burnRate * 100) / 100,
      estimatedDaysRemaining,
      costEfficiency: Math.round(costEfficiency * 100) / 100,
      budgetHealth,
      monthlySpend,
      weeklySpend,
      dailySpend,
      largestExpenseCategory: 'Development', // Simplified for demo
      budgetTrend,
    };
  }

  private async generateBudgetForecast(
    dto: BudgetAnalyticsDto,
    metrics: BudgetMetrics
  ): Promise<BudgetForecast> {
    const riskFactors: string[] = [];
    const costSavingOpportunities: string[] = [];

    // Calculate expected overrun
    const expectedOverrun = Math.max(
      0,
      metrics.projectedSpend - metrics.totalBudget
    );

    // Calculate overrun probability based on current trends
    let overrunProbability = 0;
    if (metrics.budgetVariance > 0) {
      overrunProbability = Math.min(95, metrics.budgetVariance * 2);
    } else if (metrics.budgetUtilization > 80) {
      overrunProbability = (metrics.budgetUtilization - 80) * 3;
    }

    // Assess risk factors
    if (metrics.burnRate > metrics.totalBudget * 0.1) {
      // Burning more than 10% per month
      riskFactors.push('High burn rate may deplete budget quickly');
    }

    if (metrics.budgetTrend === 'increasing') {
      riskFactors.push('Spend rate is increasing over time');
    }

    if (metrics.costEfficiency > 1.2) {
      riskFactors.push('Cost efficiency is below optimal levels');
    }

    if (metrics.estimatedDaysRemaining < 30) {
      riskFactors.push('Budget may be depleted within 30 days');
    }

    // Generate cost saving opportunities
    if (metrics.weeklySpend > (metrics.monthlySpend / 4) * 1.2) {
      costSavingOpportunities.push(
        'Recent spending spike - review and optimize current expenses'
      );
    }

    if (metrics.costEfficiency > 1.1) {
      costSavingOpportunities.push(
        'Improve resource allocation to enhance cost efficiency'
      );
    }

    costSavingOpportunities.push(
      'Review vendor contracts for potential renegotiation'
    );
    costSavingOpportunities.push(
      'Optimize development processes to reduce overhead'
    );

    // Calculate recommended budget adjustment
    let recommendedBudgetAdjustment = 0;
    if (expectedOverrun > 0) {
      recommendedBudgetAdjustment = expectedOverrun * 1.1; // 10% buffer
    } else if (
      metrics.budgetUtilization < 50 &&
      metrics.estimatedDaysRemaining > 90
    ) {
      recommendedBudgetAdjustment = -(metrics.totalBudget * 0.2); // Suggest reduction if underutilized
    }

    // Calculate projected completion cost
    const remainingWorkPercentage = Math.max(
      0,
      100 - (metrics.spentAmount / metrics.totalBudget) * 100
    );
    const projectedCompletion =
      metrics.spentAmount +
      ((metrics.totalBudget * remainingWorkPercentage) / 100) *
        metrics.costEfficiency;

    // Calculate confidence based on data consistency
    let confidence = 75; // Base confidence
    if (metrics.budgetTrend === 'stable') confidence += 10;
    if (metrics.costEfficiency < 1.2) confidence += 10;
    if (riskFactors.length === 0) confidence += 5;
    confidence = Math.min(95, confidence);

    return {
      expectedOverrun: Math.round(expectedOverrun),
      overrunProbability: Math.round(overrunProbability),
      recommendedBudgetAdjustment: Math.round(recommendedBudgetAdjustment),
      costSavingOpportunities,
      riskFactors,
      projectedCompletion: Math.round(projectedCompletion),
      confidence: Math.round(confidence),
    };
  }

  private async getExpenseBreakdown(
    dto: BudgetAnalyticsDto
  ): Promise<ExpenseBreakdown[]> {
    // Mock expense breakdown data
    return [
      {
        category: 'Development',
        amount: 15000,
        percentage: 45,
        trend: 'stable',
        description: 'Core development and programming services',
      },
      {
        category: 'Design',
        amount: 8000,
        percentage: 24,
        trend: 'up',
        description: 'UI/UX design and creative services',
      },
      {
        category: 'Infrastructure',
        amount: 6000,
        percentage: 18,
        trend: 'down',
        description: 'Hosting, servers, and technical infrastructure',
      },
      {
        category: 'Project Management',
        amount: 4300,
        percentage: 13,
        trend: 'stable',
        description: 'Project coordination and management overhead',
      },
    ];
  }

  private async generateBudgetRecommendations(
    metrics: BudgetMetrics,
    forecast: BudgetForecast
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.budgetHealth === 'critical') {
      recommendations.push(
        '🚨 Immediate budget review required - consider emergency cost-cutting measures'
      );
    }

    if (forecast.expectedOverrun > 0) {
      recommendations.push(
        `💰 Budget overrun of $${forecast.expectedOverrun.toLocaleString()} projected - secure additional funding or reduce scope`
      );
    }

    if (metrics.budgetUtilization > 85) {
      recommendations.push(
        '📊 Budget utilization is high - monitor remaining spend carefully'
      );
    }

    if (metrics.burnRate > metrics.totalBudget * 0.1) {
      recommendations.push(
        '🔥 High burn rate detected - implement spending controls immediately'
      );
    }

    if (metrics.costEfficiency > 1.2) {
      recommendations.push(
        '⚡ Cost efficiency below optimal - review resource allocation and processes'
      );
    }

    if (
      metrics.budgetTrend === 'increasing' &&
      forecast.overrunProbability > 50
    ) {
      recommendations.push(
        '📈 Increasing spend trend with high overrun probability - take corrective action now'
      );
    }

    if (forecast.costSavingOpportunities.length > 2) {
      recommendations.push(
        '💡 Multiple cost-saving opportunities identified - prioritize implementation'
      );
    }

    if (metrics.estimatedDaysRemaining < 60 && metrics.remainingBudget > 0) {
      recommendations.push(
        `⏰ Budget estimated to last ${Math.floor(metrics.estimatedDaysRemaining / 30)} months - plan accordingly`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        '✅ Budget management is on track - continue current practices'
      );
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
}
