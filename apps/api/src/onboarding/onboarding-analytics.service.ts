import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

export interface OnboardingEvent {
  userId: string;
  organizationId: string;
  event: string;
  data?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class OnboardingAnalyticsService {
  private readonly logger = new Logger(OnboardingAnalyticsService.name);
  private events: OnboardingEvent[] = [];

  constructor(private prisma: PrismaService) {}

  async trackEvent(
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

    // For now, store in-memory since the database model doesn't exist yet in the schema
    // In production, this would be updated to use the database model
    this.events.push(analyticsEvent);

    // Log event for debugging
    this.logger.log({
      message: 'Onboarding Analytics Event',
      userId,
      organizationId,
      event,
      data,
      timestamp: analyticsEvent.timestamp,
    });
  }

  async trackStepStarted(
    userId: string,
    organizationId: string,
    stepKey: string
  ) {
    await this.trackEvent(userId, organizationId, 'step_started', { stepKey });
  }

  async trackStepCompleted(
    userId: string,
    organizationId: string,
    stepKey: string,
    timeSpent?: number
  ) {
    await this.trackEvent(userId, organizationId, 'step_completed', {
      stepKey,
      timeSpent,
    });
  }

  async trackStepSkipped(
    userId: string,
    organizationId: string,
    stepKey: string
  ) {
    await this.trackEvent(userId, organizationId, 'step_skipped', { stepKey });
  }

  async trackOnboardingStarted(userId: string, organizationId: string) {
    await this.trackEvent(userId, organizationId, 'onboarding_started');
  }

  async trackOnboardingCompleted(
    userId: string,
    organizationId: string,
    totalTimeSpent: number
  ) {
    await this.trackEvent(userId, organizationId, 'onboarding_completed', {
      totalTimeSpent,
    });
  }

  async trackOnboardingAbandoned(
    userId: string,
    organizationId: string,
    lastStep: string
  ) {
    await this.trackEvent(userId, organizationId, 'onboarding_abandoned', {
      lastStep,
    });
  }

  async trackTourStarted(userId: string, organizationId: string) {
    await this.trackEvent(userId, organizationId, 'tour_started');
  }

  async trackTourCompleted(
    userId: string,
    organizationId: string,
    timeSpent: number
  ) {
    await this.trackEvent(userId, organizationId, 'tour_completed', {
      timeSpent,
    });
  }

  async trackTourSkipped(userId: string, organizationId: string) {
    await this.trackEvent(userId, organizationId, 'tour_skipped');
  }

  // Analytics query methods
  async getEventsByUser(userId: string) {
    return this.events.filter((event) => event.userId === userId);
  }

  async getEventsByOrganization(organizationId: string) {
    return this.events.filter(
      (event) => event.organizationId === organizationId
    );
  }

  async getEventsByType(event: string) {
    return this.events.filter((e) => e.event === event);
  }

  async getOnboardingMetrics(organizationId?: string) {
    const events = organizationId
      ? this.events.filter((event) => event.organizationId === organizationId)
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
  async exportEvents() {
    return [...this.events];
  }

  // Clear events (useful for testing)
  async clearEvents() {
    this.events = [];
  }
}
