import { Module, forwardRef } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectTemplateController } from './project-template.controller';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { ProjectTemplateService } from './project-template.service';
import { WorkflowAutomationService } from './workflow-automation.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { MilestoneModule } from '../milestones/milestone.module';

@Module({
  imports: [MultiTenantPrismaModule, forwardRef(() => MilestoneModule)],
  controllers: [
    ProjectController,
    ProjectTemplateController,
    WorkflowAutomationController,
  ],
  providers: [
    ProjectService,
    ProjectTemplateService,
    WorkflowAutomationService,
  ],
  exports: [ProjectService, ProjectTemplateService, WorkflowAutomationService],
})
export class ProjectModule {}
