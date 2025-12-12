import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaModule } from '../common/database/prisma.module';
import { DatabaseValidationModule } from '../common/services/database-validation.module';

@Module({
  imports: [TerminusModule, PrismaModule, DatabaseValidationModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
  exports: [PrismaHealthIndicator],
})
export class HealthModule {}
