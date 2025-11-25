import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkflowsService, CreateWorkflowDto, ExecuteWorkflowDto } from './workflows.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';

@Controller('workflows')
@UseGuards(AuthGuard, MultiTenantGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  async create(
    @CurrentOrganizationId() organizationId: string,
    @Body() createWorkflowDto: CreateWorkflowDto
  ) {
    return await this.workflowsService.createWorkflow({
      ...createWorkflowDto,
      organizationId,
    });
  }

  @Get()
  async findAll(@CurrentOrganizationId() organizationId: string) {
    return await this.workflowsService.getWorkflows(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return await this.workflowsService.getWorkflowById(id, organizationId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Body() updateData: any
  ) {
    return await this.workflowsService.updateWorkflow(id, organizationId, updateData);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return await this.workflowsService.deleteWorkflow(id, organizationId);
  }

  @Post(':id/toggle')
  async toggle(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Body('isActive') isActive: boolean
  ) {
    return await this.workflowsService.toggleWorkflow(id, organizationId, isActive);
  }

  @Post(':id/execute')
  async execute(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Body() body: { context: any }
  ) {
    const dto: ExecuteWorkflowDto = {
      workflowId: id,
      triggerEvent: 'manual',
      context: body.context,
    };
    
    return await this.workflowsService.executeWorkflow(dto);
  }

  @Post('trigger/:triggerEvent')
  async trigger(
    @Param('triggerEvent') triggerEvent: string,
    @CurrentOrganizationId() organizationId: string,
    @Body() body: { context: any }
  ) {
    return await this.workflowsService.triggerWorkflows(triggerEvent, body.context, organizationId);
  }
}