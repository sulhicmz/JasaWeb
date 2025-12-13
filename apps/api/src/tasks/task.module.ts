import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
