import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, organizationId: string) {
    try {
      return await this.prisma.ticket.create({
        data: {
          ...createTicketDto,
          organizationId,
          status: 'open',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create ticket for organization ${organizationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          createTicketDto,
        }
      );
      throw new InternalServerErrorException('Failed to create ticket');
    }
  }

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      priority?: string;
      assigneeId?: string;
    }
  ) {
    try {
      return await this.prisma.ticket.findMany({
        where: {
          organizationId,
          ...filters,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch tickets for organization ${organizationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          filters,
        }
      );
      throw new InternalServerErrorException('Failed to fetch tickets');
    }
  }

  async findOne(id: string, organizationId: string) {
    try {
      return await this.prisma.ticket.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          assignee: true,
          project: true,
          organization: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find ticket ${id} for organization ${organizationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw new InternalServerErrorException('Failed to find ticket');
    }
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    organizationId: string
  ) {
    try {
      return await this.prisma.ticket.update({
        where: {
          id,
          organizationId,
        },
        data: updateTicketDto,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update ticket ${id} for organization ${organizationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          updateTicketDto,
        }
      );
      throw new InternalServerErrorException('Failed to update ticket');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.ticket.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to delete ticket ${id}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerErrorException('Failed to delete ticket');
    }
  }

  async getMetrics(organizationId: string) {
    try {
      const tickets = await this.prisma.ticket.groupBy({
        by: ['status', 'priority'],
        where: {
          organizationId,
        },
        _count: true,
      });

      const resolvedThisMonth = await this.prisma.ticket.count({
        where: {
          organizationId,
          status: 'resolved',
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      });

      return {
        byStatus: tickets
          .filter((t) => t.status)
          .map((t) => ({
            status: t.status,
            count: t._count,
          })),
        byPriority: tickets
          .filter((t) => t.priority)
          .map((t) => ({
            priority: t.priority,
            count: t._count,
          })),
        resolvedThisMonth,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get metrics for organization ${organizationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw new InternalServerErrorException('Failed to get ticket metrics');
    }
  }
}
