import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [MultiTenantPrismaModule, NotificationModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
