import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './services/error-handling.service';
import { AuditModule } from './services/audit.module';

@Module({
  imports: [AuditModule],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}