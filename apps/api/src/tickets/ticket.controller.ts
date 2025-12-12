import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  Query,
  Logger,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { EmailService } from '../common/services/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateTicketDto, UpdateTicketDto } from './dto/ticket.dto';
import { TicketStatus } from '../common/enums';

@Controller('tickets')
@UseGuards(RolesGuard)
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly emailService: EmailService
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance, Role.Member)
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    if (createTicketDto.projectId) {
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: createTicketDto.projectId },
      });

      if (!project) {
        throw new BadRequestException(
          'Project does not exist or does not belong to your organization'
        );
      }
    }

    const ticket = await this.multiTenantPrisma.ticket.create({
      data: {
        ...createTicketDto,
        organizationId,
        status: TicketStatus.Open,
        slaDueAt: this.calculateSlaDueDate(createTicketDto.priority),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if ((ticket as any).assignee) {
      await this.emailService.sendTicketCreatedNotification(
        (ticket as any).assignee?.email,
        (ticket as any).title,
        (ticket as any).project?.name || 'General',
        (ticket as any).description
      );
    }

    this.logger.log(
      `Ticket created: ${(ticket as any).title} for organization ${organizationId}`
    );

    return ticket;
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: TicketStatus,
    @Query('assigneeId') assigneeId?: string,
    @CurrentOrganizationId() organizationId: string = ''
  ) {
    const whereClause: any = { organizationId };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }

    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      tickets,
      total: tickets.length,
    };
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    const ticket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    return ticket;
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    const existingTicket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new BadRequestException('Ticket not found');
    }

    const updatedTicket = await this.multiTenantPrisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Ticket updated: ${(updatedTicket as any).title} for organization ${organizationId}`
    );

    return updatedTicket;
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    const existingTicket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new BadRequestException('Ticket not found');
    }

    await this.multiTenantPrisma.ticket.delete({
      where: { id },
    });

    this.logger.log(`Ticket deleted: ${id} for organization ${organizationId}`);

    return { message: 'Ticket deleted successfully' };
  }

  private calculateSlaDueDate(priority: any): Date {
    const now = new Date();
    const slaTimeframes: Record<any, number> = {
      critical: 4,
      high: 24,
      medium: 72,
      low: 168,
    };

    const hoursToAdd = slaTimeframes[priority] || 168;
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }
}
