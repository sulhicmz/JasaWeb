import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('projects')
@UseGuards(RolesGuard) // Use the roles guard
export class ProjectController {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only these roles can create projects
  create(@Body() createProjectDto: any, @CurrentOrganizationId() organizationId: string) {
    return this.multiTenantPrisma.project.create({
      data: {
        ...createProjectDto,
        organizationId, // This is automatically included by the multi-tenant service
      },
    });
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll() {
    return this.multiTenantPrisma.project.findMany();
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findOne(@Param('id') id: string) {
    return this.multiTenantPrisma.project.findUnique({
      where: { id },
    });
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update
  update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.multiTenantPrisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner) // Only org owner can delete
  remove(@Param('id') id: string) {
    return this.multiTenantPrisma.project.delete({
      where: { id },
    });
  }
}