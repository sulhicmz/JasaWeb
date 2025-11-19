import { Module } from '@nestjs/common';
import { AuditModule } from './audit.module';
import { ErrorHandlingService } from './error-handling.service';

@Module({
  imports: [AuditModule],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}
