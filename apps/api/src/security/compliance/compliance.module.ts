import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { PrismaModule } from '../../common/database/prisma.module';
import { DataEncryptionModule } from '../encryption/data-encryption.module';
import { AuditModule } from '../../common/services/audit.module';

@Module({
  imports: [PrismaModule, DataEncryptionModule, AuditModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
