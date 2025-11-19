import { Module } from '@nestjs/common';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
