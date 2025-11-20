import { Module, forwardRef } from '@nestjs/common';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [MultiTenantPrismaModule, forwardRef(() => ProjectModule)],
  controllers: [MilestoneController],
  providers: [MilestoneService],
  exports: [MilestoneService],
})
export class MilestoneModule {}
