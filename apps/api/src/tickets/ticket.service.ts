import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { EmailService } from '../common/services/email.service';

export interface CreateTicketDto {
  type: string; // bug, feature, improvement, question, task
  priority: string; // low, medium, high, critical
  projectId?: string;
}

export interface UpdateTicketDto {
  type?: string;
  priority?: string;
  status?: string; // open, in-progress, in-review, resolved, closed
  assigneeId?: string;
}

@Injectable()
export class TicketService {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly emailService: EmailService
  ) {}

  async create(createTicketDto: CreateTicketDto, organizationId: string) {
    // If a project is specified, validate that it belongs to the organization
    if (createTicketDto.projectId) {
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: createTicketDto.projectId },
      });

      if (!project || project.organizationId !== organizationId) {
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
    if ((ticket as any).assignee) {
      await this.emailService.sendTicketCreatedNotification(
        (ticket as any).assignee.email,
        `${ticket.type} - ${ticket.priority}`,
        (ticket as any).project?.name || 'General',
        `Ticket ID: ${ticket.id}`
      );
    }

    return ticket;
  }

  async findAll(
    organizationId: string,
    filters?: {
      projectId?: string;
      status?: string;
      assigneeId?: string;
    }
  ) {
    // Build query based on filters
    const whereClause: any = { organizationId };

    if (filters?.projectId) {
      whereClause.projectId = filters.projectId;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.assigneeId) {
      whereClause.assigneeId = filters.assigneeId;
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

  async findOne(id: string, organizationId: string) {
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
      throw new NotFoundException('Ticket not found');
    }

    // Verify that the ticket belongs to the current organization
    if (ticket.organizationId !== organizationId) {
      throw new BadRequestException(
        'Ticket does not belong to your organization'
      );
    }

    return ticket;
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    organizationId: string
  ) {
    // Check if ticket exists and belongs to the organization
    const existingTicket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new NotFoundException('Ticket not found');
    }

    if (existingTicket.organizationId !== organizationId) {
      throw new BadRequestException(
        'Ticket does not belong to your organization'
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
        await this.emailService.sendTicketCreatedNotification(
          assigneeUser.email,
          `${updatedTicket.type} - ${updatedTicket.priority}`,
          (updatedTicket as any).project?.name || 'General',
          `Ticket ID: ${updatedTicket.id}`
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
          await this.emailService.sendTicketStatusChangedNotification(
            assigneeUser.email,
            updatedTicket.id,
            `${updatedTicket.type} - ${updatedTicket.priority}`,
            updatedTicket.status
          );
        }
      }
    }

    return updatedTicket;
  }

  async remove(id: string, organizationId: string) {
    const ticket = await this.multiTenantPrisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.organizationId !== organizationId) {
      throw new BadRequestException(
        'Ticket does not belong to your organization'
      );
    }

    await this.multiTenantPrisma.ticket.delete({
      where: { id },
    });

    return { message: 'Ticket deleted successfully' };
  }

  /**
   * Calculate SLA due date based on ticket priority
   */
  private calculateSlaDueDate(priority: string): Date {
    const now = new Date();

    // Define SLA timeframes (in hours) based on priority
    const slaTimeframes: { [key: string]: number } = {
      critical: 4, // 4 hours
      high: 24, // 1 day
      medium: 72, // 3 days
      low: 168, // 1 week
    };

    const hoursToAdd = slaTimeframes[priority] || 168; // Default to 1 week for low priority
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }
}
