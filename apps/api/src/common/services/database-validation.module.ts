import { Module } from '@nestjs/common';
import { DatabaseValidationService } from './database-validation.service';

@Module({
  providers: [DatabaseValidationService],
  exports: [DatabaseValidationService],
})
export class DatabaseValidationModule {}
