import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from '../onboarding/onboarding.service';

@Controller('analytics/onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingAnalyticsController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('overview')
  async getOnboardingOverview() {
    const analytics = await this.onboardingService.getOnboardingAnalytics();

    return {
      ...analytics,
      insights: this.generateInsights(analytics),
    };
  }

  @Get('drop-off-points')
  async getDropOffPoints() {
    // This would require more detailed tracking in a real implementation
    return {
      stepDropOffs: [
        { stepId: 'welcome', dropOffRate: 5, users: 10 },
        { stepId: 'profile_setup', dropOffRate: 15, users: 30 },
        { stepId: 'dashboard_tour', dropOffRate: 8, users: 16 },
        { stepId: 'project_overview', dropOffRate: 12, users: 24 },
        { stepId: 'approval_workflow', dropOffRate: 3, users: 6 },
      ],
      recommendations: [
        'Profile setup step has the highest drop-off rate - consider simplifying the form',
        'Dashboard tour is performing well - keep the interactive elements',
        'Consider making file management step optional to reduce friction',
      ],
    };
  }

  @Get('completion-time-analysis')
  async getCompletionTimeAnalysis() {
    // Mock data - in real implementation, this would come from database
    return {
      averageCompletionTime: 2.5, // hours
      medianCompletionTime: 1.8, // hours
      completionTimeDistribution: [
        { range: '0-30 min', count: 45, percentage: 30 },
        { range: '30-60 min', count: 60, percentage: 40 },
        { range: '1-2 hours', count: 30, percentage: 20 },
        { range: '2+ hours', count: 15, percentage: 10 },
      ],
      fastestCompletion: 12, // minutes
      slowestCompletion: 480, // minutes (8 hours)
    };
  }

  @Get('user-satisfaction')
  async getUserSatisfactionMetrics() {
    // Mock data - would come from user feedback surveys
    return {
      overallSatisfaction: 4.2, // out of 5
      satisfactionByStep: [
        { stepId: 'welcome', rating: 4.5, feedback: 'Clear and welcoming' },
        {
          stepId: 'profile_setup',
          rating: 3.8,
          feedback: 'Form is a bit long',
        },
        {
          stepId: 'dashboard_tour',
          rating: 4.6,
          feedback: 'Interactive and helpful',
        },
        { stepId: 'project_overview', rating: 4.1, feedback: 'Good overview' },
        {
          stepId: 'approval_workflow',
          rating: 4.3,
          feedback: 'Easy to understand',
        },
      ],
      commonFeedback: [
        'The interactive tour is very helpful',
        'Profile setup could be simplified',
        'Would like to skip certain steps',
        'More video tutorials would be nice',
      ],
    };
  }

  private generateInsights(analytics: any) {
    const insights = [];

    if (analytics.completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        description: `Only ${analytics.completionRate.toFixed(1)}% of users complete onboarding. Consider simplifying the flow.`,
      });
    }

    if (analytics.completionRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Completion Rate',
        description: `${analytics.completionRate.toFixed(1)}% completion rate is well above industry average.`,
      });
    }

    if (analytics.averageCompletionTime > 4) {
      insights.push({
        type: 'info',
        title: 'Long Completion Time',
        description: `Users take ${analytics.averageCompletionTime.toFixed(1)} hours on average. Consider breaking down complex steps.`,
      });
    }

    const inProgressRate =
      (analytics.distribution.inProgress / analytics.totalUsers) * 100;
    if (inProgressRate > 30) {
      insights.push({
        type: 'warning',
        title: 'High In-Progress Rate',
        description: `${inProgressRate.toFixed(1)}% of users start but don't complete onboarding. Consider adding reminders.`,
      });
    }

    return insights;
  }
}
