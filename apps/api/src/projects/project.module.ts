import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService, ProjectController],
})
export class ProjectModule {}
