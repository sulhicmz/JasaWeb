import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MilestoneService, CreateMilestoneDto, UpdateMilestoneDto } from './milestone.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('milestones')
@UseGuards(RolesGuard) // Use the roles guard
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Allow multiple roles to create
  async create(
    @Body() createMilestoneDto: CreateMilestoneDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
    return this.milestoneService.create(createMilestoneDto, organizationId);
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findAll(
    @Query('projectId') projectId?: string,
    @CurrentOrganizationId() organizationId: string = '',
  ) {
    return this.milestoneService.findAll(projectId, organizationId);
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    return this.milestoneService.findOne(id, organizationId);
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Allow multiple roles to update
  async update(
    @Param('id') id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
    return this.milestoneService.update(id, updateMilestoneDto, organizationId);
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only org owners and admins can delete
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    return this.milestoneService.remove(id, organizationId);
  }
}