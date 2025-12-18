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
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { EmailService } from '../common/services/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('tickets')
@UseGuards(AuthGuard, RolesGuard) // Use authentication and roles guard
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly emailService: EmailService
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance, Role.Member) // Allow multiple roles to create
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    // If a project is specified, validate that it belongs to the organization
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

    // Create the ticket
    const ticket = await this.multiTenantPrisma.ticket.create({
      data: {
        ...createTicketDto,
        organizationId,
        status: 'open', // Default status
        // Calculate SLA due date based on priority
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

    // Send notification email to the assigned user if any
    const ticketWithRelations = ticket as typeof ticket & {
      assignee?: { email: string };
      project?: { name: string };
      title: string;
      description: string;
    };
    if (ticketWithRelations.assignee) {
      await this.emailService.sendTicketCreatedNotification(
        ticketWithRelations.assignee?.email,
        ticketWithRelations.title,
        ticketWithRelations.project?.name || 'General',
        ticketWithRelations.description
      );
    }

    this.logger.log(
      `Ticket created: ${ticketWithRelations.title} for organization ${organizationId}`
    );

    return ticket;
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @CurrentOrganizationId() organizationId: string = ''
  ) {
    // Build query based on filters
    const whereClause: {
      organizationId: string;
      projectId?: string;
      status?: string;
      assigneeId?: string;
    } = { organizationId }; // Ensure multi-tenant isolation

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }

    return await this.multiTenantPrisma.ticket.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
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
      throw new BadRequestException(
        'Ticket not found or does not belong to your organization'
      );
    }

    // Verify that the ticket belongs to the current organization
    if (ticket.organizationId !== organizationId) {
      throw new BadRequestException(
        'Ticket does not belong to your organization'
      );
    }

    return ticket;
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Allow multiple roles to update
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    // Check if ticket exists and belongs to the organization
    const existingTicket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new BadRequestException(
        'Ticket not found or does not belong to your organization'
      );
    }

    // If updating the assignee, validate that the user exists
    if (updateTicketDto.assigneeId) {
      const assignee = await this.multiTenantPrisma.user.findUnique({
        where: { id: updateTicketDto.assigneeId },
      });

      if (!assignee) {
        throw new BadRequestException('Assignee user does not exist');
      }
    }

    // Update the ticket
    const updatedTicket = await this.multiTenantPrisma.ticket.update({
      where: { id },
      data: {
        ...updateTicketDto,
        // Update SLA due date if priority changed
        ...(updateTicketDto.priority &&
          existingTicket.priority !== updateTicketDto.priority && {
            slaDueAt: this.calculateSlaDueDate(updateTicketDto.priority),
          }),
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

    // If the assignee was updated, send notification email
    if (
      updateTicketDto.assigneeId &&
      existingTicket.assigneeId !== updateTicketDto.assigneeId
    ) {
      const assigneeUser = await this.multiTenantPrisma.user.findUnique({
        where: { id: updateTicketDto.assigneeId },
      });

      if (assigneeUser) {
        const updatedTicketWithRelations =
          updatedTicket as typeof updatedTicket & {
            title: string;
            description: string;
            project?: { name: string };
          };
        await this.emailService.sendTicketCreatedNotification(
          assigneeUser.email,
          updatedTicketWithRelations.title,
          updatedTicketWithRelations.project?.name || 'General',
          updatedTicketWithRelations.description
        );
      }
    }

    // If the status was updated, send notification email
    if (
      updateTicketDto.status &&
      existingTicket.status !== updateTicketDto.status
    ) {
      if (existingTicket.assigneeId) {
        const assigneeUser = await this.multiTenantPrisma.user.findUnique({
          where: { id: existingTicket.assigneeId },
        });

        if (assigneeUser) {
          const updatedTicketWithTitle =
            updatedTicket as typeof updatedTicket & {
              title: string;
            };
          await this.emailService.sendTicketStatusChangedNotification(
            assigneeUser.email,
            updatedTicket.id,
            updatedTicketWithTitle.title,
            updatedTicket.status
          );
        }
      }
    }

    this.logger.log(
      `Ticket updated: ${(updatedTicket as typeof updatedTicket & { title: string }).title} for organization ${organizationId}`
    );

    return updatedTicket;
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only org owners and admins can delete
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    const ticket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new BadRequestException(
        'Ticket not found or does not belong to your organization'
      );
    }

    const deletedTicket = await this.multiTenantPrisma.ticket.delete({
      where: { id },
    });

    this.logger.log(
      `Ticket deleted: ${(deletedTicket as typeof deletedTicket & { title: string }).title} for organization ${organizationId}`
    );

    return { message: 'Ticket deleted successfully' };
  }

  /**
   * Calculate SLA due date based on ticket priority
   */
  private calculateSlaDueDate(priority: string): Date {
    const now = new Date();

    // Validate priority to prevent injection
    const validPriorities = new Set(['critical', 'high', 'medium', 'low']);
    const safePriority = validPriorities.has(priority) ? priority : 'low';
    // Use safe object literal to prevent prototype pollution
    const timeframes = Object.create(null) as Record<string, number>;
    Object.defineProperty(timeframes, 'critical', {
      value: 4,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(timeframes, 'high', {
      value: 24,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(timeframes, 'medium', {
      value: 72,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(timeframes, 'low', {
      value: 168,
      writable: false,
      enumerable: true,
    });
    const hoursToAdd = Object.prototype.hasOwnProperty.call(
      timeframes,
      safePriority
    )
      ? (timeframes as Record<string, number>)[safePriority] || 168
      : 168; // Default to 1 week for low priority
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }
}
