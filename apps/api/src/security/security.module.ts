import { Module } from '@nestjs/common';
import { MfaModule } from './mfa/mfa.module';
import { SecurityMonitoringModule } from './monitoring/security-monitoring.module';
import { DataEncryptionModule } from './encryption/data-encryption.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    MfaModule,
    SecurityMonitoringModule,
    DataEncryptionModule,
    ComplianceModule,
  ],
  exports: [
    MfaModule,
    SecurityMonitoringModule,
    DataEncryptionModule,
    ComplianceModule,
  ],
})
export class SecurityModule {}
