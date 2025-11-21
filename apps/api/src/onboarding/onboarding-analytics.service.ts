import { Injectable } from '@nestjs/common';

export interface OnboardingEvent {
  userId: string;
  organizationId: string;
  event: string;
  data?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class OnboardingAnalyticsService {
  private events: OnboardingEvent[] = [];

  trackEvent(
    userId: string,
    organizationId: string,
    event: string,
    data?: Record<string, any>
  ) {
    const analyticsEvent: OnboardingEvent = {
      userId,
      organizationId,
      event,
      data,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);

    // Log event for now (in production, this would go to a proper analytics service)
    console.log('Onboarding Analytics Event:', {
      userId,
      organizationId,
      event,
      data,
      timestamp: analyticsEvent.timestamp,
    });

    // In a real implementation, you would send this to:
    // - Google Analytics
    // - Mixpanel/Amplitude
    // - Internal analytics database
    // - Data warehouse
  }

  trackStepStarted(userId: string, organizationId: string, stepKey: string) {
    this.trackEvent(userId, organizationId, 'step_started', { stepKey });
  }

  trackStepCompleted(
    userId: string,
    organizationId: string,
    stepKey: string,
    timeSpent?: number
  ) {
    this.trackEvent(userId, organizationId, 'step_completed', {
      stepKey,
      timeSpent,
    });
  }

  trackStepSkipped(userId: string, organizationId: string, stepKey: string) {
    this.trackEvent(userId, organizationId, 'step_skipped', { stepKey });
  }

  trackOnboardingStarted(userId: string, organizationId: string) {
    this.trackEvent(userId, organizationId, 'onboarding_started');
  }

  trackOnboardingCompleted(
    userId: string,
    organizationId: string,
    totalTimeSpent: number
  ) {
    this.trackEvent(userId, organizationId, 'onboarding_completed', {
      totalTimeSpent,
    });
  }

  trackOnboardingAbandoned(
    userId: string,
    organizationId: string,
    lastStep: string
  ) {
    this.trackEvent(userId, organizationId, 'onboarding_abandoned', {
      lastStep,
    });
  }

  trackTourStarted(userId: string, organizationId: string) {
    this.trackEvent(userId, organizationId, 'tour_started');
  }

  trackTourCompleted(
    userId: string,
    organizationId: string,
    timeSpent: number
  ) {
    this.trackEvent(userId, organizationId, 'tour_completed', { timeSpent });
  }

  trackTourSkipped(userId: string, organizationId: string) {
    this.trackEvent(userId, organizationId, 'tour_skipped');
  }

  // Analytics query methods
  getEventsByUser(userId: string): OnboardingEvent[] {
    return this.events.filter((event) => event.userId === userId);
  }

  getEventsByOrganization(organizationId: string): OnboardingEvent[] {
    return this.events.filter(
      (event) => event.organizationId === organizationId
    );
  }

  getEventsByType(event: string): OnboardingEvent[] {
    return this.events.filter((e) => e.event === event);
  }

  getOnboardingMetrics(organizationId?: string) {
    const events = organizationId
      ? this.getEventsByOrganization(organizationId)
      : this.events;

    const started = events.filter(
      (e) => e.event === 'onboarding_started'
    ).length;
    const completed = events.filter(
      (e) => e.event === 'onboarding_completed'
    ).length;
    const abandoned = events.filter(
      (e) => e.event === 'onboarding_abandoned'
    ).length;

    const completionRate = started > 0 ? (completed / started) * 100 : 0;
    const abandonmentRate = started > 0 ? (abandoned / started) * 100 : 0;

    // Calculate average completion time
    const completionEvents = events.filter(
      (e) => e.event === 'onboarding_completed'
    );
    const avgCompletionTime =
      completionEvents.length > 0
        ? completionEvents.reduce(
            (sum, event) => sum + (event.data?.totalTimeSpent || 0),
            0
          ) / completionEvents.length
        : 0;

    // Step completion rates
    const stepEvents = events.filter((e) => e.event.startsWith('step_'));
    const stepMetrics = this.calculateStepMetrics(stepEvents);

    return {
      totalStarted: started,
      totalCompleted: completed,
      totalAbandoned: abandoned,
      completionRate: Math.round(completionRate * 100) / 100,
      abandonmentRate: Math.round(abandonmentRate * 100) / 100,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100,
      stepMetrics,
    };
  }

  private calculateStepMetrics(stepEvents: OnboardingEvent[]) {
    const stepStats: Record<
      string,
      { started: number; completed: number; skipped: number }
    > = {};

    stepEvents.forEach((event) => {
      const stepKey = event.data?.stepKey;
      if (!stepKey) return;

      if (!stepStats[stepKey]) {
        stepStats[stepKey] = { started: 0, completed: 0, skipped: 0 };
      }

      if (event.event === 'step_started') {
        stepStats[stepKey].started++;
      } else if (event.event === 'step_completed') {
        stepStats[stepKey].completed++;
      } else if (event.event === 'step_skipped') {
        stepStats[stepKey].skipped++;
      }
    });

    // Calculate completion rates for each step
    const metrics: Record<string, any> = {};
    Object.entries(stepStats).forEach(([stepKey, stats]) => {
      const completionRate =
        stats.started > 0 ? (stats.completed / stats.started) * 100 : 0;
      const skipRate =
        stats.started > 0 ? (stats.skipped / stats.started) * 100 : 0;

      metrics[stepKey] = {
        ...stats,
        completionRate: Math.round(completionRate * 100) / 100,
        skipRate: Math.round(skipRate * 100) / 100,
      };
    });

    return metrics;
  }

  // Export events for external analysis
  exportEvents(): OnboardingEvent[] {
    return [...this.events];
  }

  // Clear events (useful for testing)
  clearEvents() {
    this.events = [];
  }
}
