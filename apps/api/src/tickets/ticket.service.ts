import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, organizationId: string) {
    return this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        organizationId,
        status: 'open',
      },
    });
  }

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      priority?: string;
      assigneeId?: string;
    }
  ) {
    return this.prisma.ticket.findMany({
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
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.ticket.findFirst({
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
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    organizationId: string
  ) {
    return this.prisma.ticket.update({
      where: {
        id,
        organizationId,
      },
      data: updateTicketDto,
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.ticket.delete({
      where: {
        id,
      },
    });
  }

  async getMetrics(organizationId: string) {
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
  }
}
