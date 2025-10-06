import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Service that wraps Prisma to enforce multi-tenant data isolation
 * This service intercepts Prisma operations to ensure they're scoped to the current organization
 */
@Injectable({ scope: Scope.REQUEST })
export class MultiTenantPrismaService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: Request,
  ) {}

  /**
   * Helper method to get the current organization ID
   */
  private get organizationId(): string {
    const orgId = (this.request as any).organizationId;
    if (!orgId) {
      throw new BadRequestException('Organization context not found. Please ensure multi-tenant middleware is applied.');
    }
    return orgId;
  }

  /**
   * Projects service methods
   */
  project = {
    findMany: (args?: Prisma.ProjectFindManyArgs) => {
      return this.prisma.project.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: Prisma.ProjectFindUniqueArgs) => {
      return this.prisma.project.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: Prisma.ProjectCreateArgs) => {
      return this.prisma.project.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: Prisma.ProjectUpdateArgs) => {
      return this.prisma.project.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: Prisma.ProjectDeleteArgs) => {
      return this.prisma.project.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },
  };

  /**
   * Milestones service methods
   */
  milestone = {
    findMany: (args?: Prisma.MilestoneFindManyArgs) => {
      return this.prisma.milestone.findMany({
        ...args,
        where: {
          ...args?.where,
          project: {
            organizationId: this.organizationId,
            ...args?.where?.project,
          },
        },
      });
    },

    findUnique: (args: Prisma.MilestoneFindUniqueArgs) => {
      return this.prisma.milestone.findUnique({
        ...args,
        where: {
          ...args.where,
          project: {
            organizationId: this.organizationId,
            ...args.where.project,
          },
        },
      });
    },

    create: (args: Prisma.MilestoneCreateArgs) => {
      return this.prisma.milestone.create({
        ...args,
        data: {
          ...args.data,
          project: {
            connect: {
              id: args.data.project.connect.id,
              organizationId: this.organizationId, // This ensures we're connecting to a project in the current org
            },
          },
        },
      });
    },

    update: (args: Prisma.MilestoneUpdateArgs) => {
      return this.prisma.milestone.update({
        ...args,
        where: {
          ...args.where,
          project: {
            organizationId: this.organizationId,
            ...args.where.project,
          },
        },
        data: args.data,
      });
    },

    delete: (args: Prisma.MilestoneDeleteArgs) => {
      return this.prisma.milestone.delete({
        ...args,
        where: {
          ...args.where,
          project: {
            organizationId: this.organizationId,
            ...args.where.project,
          },
        },
      });
    },
  };

  /**
   * Files service methods
   */
  file = {
    findMany: (args?: Prisma.FileFindManyArgs) => {
      return this.prisma.file.findMany({
        ...args,
        where: {
          ...args?.where,
          project: {
            organizationId: this.organizationId,
            ...args?.where?.project,
          },
        },
      });
    },

    findUnique: (args: Prisma.FileFindUniqueArgs) => {
      return this.prisma.file.findUnique({
        ...args,
        where: {
          ...args.where,
          project: {
            organizationId: this.organizationId,
            ...args.where.project,
          },
        },
      });
    },

    create: (args: Prisma.FileCreateArgs) => {
      return this.prisma.file.create({
        ...args,
        data: {
          ...args.data,
          project: {
            connect: {
              id: args.data.project.connect.id,
              organizationId: this.organizationId, // Ensures connection to project in current org
            },
          },
        },
      });
    },

    update: (args: Prisma.FileUpdateArgs) => {
      return this.prisma.file.update({
        ...args,
        where: {
          ...args.where,
          project: {
            organizationId: this.organizationId,
            ...args.where.project,
          },
        },
        data: args.data,
      });
    },

    delete: (args: Prisma.FileDeleteArgs) => {
      return this.prisma.file.delete({
        ...args,
        where: {
          ...args.where,
          project: {
            organizationId: this.organizationId,
            ...args.where.project,
          },
        },
      });
    },
  };

  /**
   * Tickets service methods
   */
  ticket = {
    findMany: (args?: Prisma.TicketFindManyArgs) => {
      return this.prisma.ticket.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: Prisma.TicketFindUniqueArgs) => {
      return this.prisma.ticket.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: Prisma.TicketCreateArgs) => {
      return this.prisma.ticket.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: Prisma.TicketUpdateArgs) => {
      return this.prisma.ticket.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: Prisma.TicketDeleteArgs) => {
      return this.prisma.ticket.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },
  };

  /**
   * Invoices service methods
   */
  invoice = {
    findMany: (args?: Prisma.InvoiceFindManyArgs) => {
      return this.prisma.invoice.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: Prisma.InvoiceFindUniqueArgs) => {
      return this.prisma.invoice.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: Prisma.InvoiceCreateArgs) => {
      return this.prisma.invoice.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: Prisma.InvoiceUpdateArgs) => {
      return this.prisma.invoice.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: Prisma.InvoiceDeleteArgs) => {
      return this.prisma.invoice.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },
  };
}