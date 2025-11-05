import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './error-handling.service';
import { AuditModule } from './audit.module';

@Module({
  imports: [AuditModule],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}