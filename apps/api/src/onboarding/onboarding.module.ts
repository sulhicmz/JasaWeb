import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingAnalyticsService } from './onboarding-analytics.service';
import { PrismaModule } from '../common/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingAnalyticsService],
  exports: [OnboardingService, OnboardingAnalyticsService],
})
export class OnboardingModule {}
