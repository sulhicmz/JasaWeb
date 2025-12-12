import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { ProjectAnalyticsController } from './project-analytics.controller';
import { ProjectAnalyticsService } from './project-analytics.service';
import { BudgetAnalyticsService } from './budget-analytics.service';
import { HealthRecommendationService } from './health-recommendation.service';

@Module({
  controllers: [AnalyticsController, ProjectAnalyticsController],
  providers: [
    AnalyticsService,
    PredictiveAnalyticsService,
    ProjectAnalyticsService,
    BudgetAnalyticsService,
    HealthRecommendationService,
  ],
  exports: [
    AnalyticsService,
    PredictiveAnalyticsService,
    ProjectAnalyticsService,
    BudgetAnalyticsService,
    HealthRecommendationService,
  ],
})
export class AnalyticsModule {}
