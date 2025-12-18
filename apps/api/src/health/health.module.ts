import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaModule } from '../common/database/prisma.module';
import { DatabaseMonitorService } from '../common/services/database-monitor.service';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, DatabaseMonitorService],
  exports: [PrismaHealthIndicator, DatabaseMonitorService],
})
export class HealthModule {}
