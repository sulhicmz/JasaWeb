import { Module } from '@nestjs/common';
import { GanttController } from './gantt.controller';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [GanttController],
  providers: [MultiTenantPrismaService],
  exports: [GanttController],
})
export class GanttModule {}
