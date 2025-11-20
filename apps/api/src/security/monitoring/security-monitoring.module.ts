import { Module } from '@nestjs/common';
import { SecurityMonitoringService } from './security-monitoring.service';
import { SecurityMonitoringController } from './security-monitoring.controller';
import { PrismaModule } from '../../common/database/prisma.module';
import { AuditModule } from '../../common/services/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SecurityMonitoringController],
  providers: [SecurityMonitoringService],
  exports: [SecurityMonitoringService],
})
export class SecurityMonitoringModule {}
