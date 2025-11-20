import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Roles,
} from '@nestjs/common';
import { WorkflowAutomationService } from './workflow-automation.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkflowRuleDto } from './workflow-automation.service';

@Controller('workflow-automation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowAutomationController {
  constructor(
    private readonly workflowAutomationService: WorkflowAutomationService
  ) {}

  // Workflow Rule endpoints
  @Post('rules')
  @Roles('admin', 'owner')
  createRule(@Body() createDto: CreateWorkflowRuleDto) {
    return this.workflowAutomationService.createWorkflowRule(createDto);
  }

  @Get('rules')
  @Roles('admin', 'owner')
  findAllRules() {
    return this.workflowAutomationService.findAllWorkflowRules();
  }

  @Get('rules/:id')
  @Roles('admin', 'owner')
  findOneRule(@Param('id') id: string) {
    return this.workflowAutomationService.findWorkflowRuleById(id);
  }

  @Patch('rules/:id')
  @Roles('admin', 'owner')
  updateRule(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateWorkflowRuleDto>
  ) {
    return this.workflowAutomationService.updateWorkflowRule(id, updateDto);
  }

  @Delete('rules/:id')
  @Roles('admin', 'owner')
  removeRule(@Param('id') id: string) {
    return this.workflowAutomationService.deleteWorkflowRule(id);
  }

  // Setup and Analytics endpoints
  @Post('setup-default-rules')
  @Roles('admin', 'owner')
  setupDefaultRules() {
    return this.workflowAutomationService.setupDefaultWorkflowRules();
  }

  @Get('analytics/execution-stats')
  @Roles('admin', 'owner')
  getExecutionStats() {
    return this.workflowAutomationService.getWorkflowExecutionStats();
  }
}
