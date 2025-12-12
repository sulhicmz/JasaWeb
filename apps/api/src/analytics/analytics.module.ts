import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ProjectAnalyticsService } from './project-analytics.service';
import { PrismaModule } from '../common/database/prisma.module';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';

@Module({
  imports: [PrismaModule, MultiTenantPrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ProjectAnalyticsService],
  exports: [AnalyticsService, ProjectAnalyticsService],
})
export class AnalyticsModule {}
