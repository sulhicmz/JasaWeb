import { Module } from '@nestjs/common';
import { TaskDependenciesService } from './task-dependencies.service';
import { TaskDependenciesController } from './task-dependencies.controller';
import { PrismaModule } from '../common/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TaskDependenciesService],
  controllers: [TaskDependenciesController],
  exports: [TaskDependenciesService],
})
export class TaskDependenciesModule {}