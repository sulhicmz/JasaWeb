import { Module } from '@nestjs/common';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [MilestoneController],
  providers: [MilestoneService],
  exports: [MilestoneService],
})
export class MilestoneModule {}