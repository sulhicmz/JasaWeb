import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../common/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}