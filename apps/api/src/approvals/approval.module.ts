import { Module } from '@nestjs/common';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
