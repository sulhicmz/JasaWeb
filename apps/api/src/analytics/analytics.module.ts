import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ProjectAnalyticsController } from './project-analytics.controller';
import { ProjectAnalyticsService } from './project-analytics.service';
import { BudgetAnalyticsService } from './budget-analytics.service';
import { HealthRecommendationService } from './health-recommendation.service';

@Module({
  controllers: [AnalyticsController, ProjectAnalyticsController],
  providers: [
    AnalyticsService,
    ProjectAnalyticsService,
    BudgetAnalyticsService,
    HealthRecommendationService,
  ],
  exports: [
    AnalyticsService,
    ProjectAnalyticsService,
    BudgetAnalyticsService,
    HealthRecommendationService,
  ],
})
export class AnalyticsModule {}
