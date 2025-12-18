import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SecurityController } from './security.controller';
import { SecurityMonitoringService } from './security-monitoring.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SecurityController],
  providers: [SecurityMonitoringService],
  exports: [SecurityMonitoringService],
})
export class SecurityModule {}
