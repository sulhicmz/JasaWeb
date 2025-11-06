import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ErrorHandlingService } from './services/error-handling.service';
import { AuditModule } from './services/audit.module';
=======
import { ErrorHandlingService } from './error-handling.service';
import { AuditModule } from './audit.module';
>>>>>>> origin/main

@Module({
  imports: [AuditModule],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}