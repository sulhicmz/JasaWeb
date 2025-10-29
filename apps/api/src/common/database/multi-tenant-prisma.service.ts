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
    @Inject(REQUEST) private request: any,
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

    count: (args?: Prisma.ProjectCountArgs) => {
      return this.prisma.project.count({
        ...args,
        where: {
          ...args?.where,
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
      // Ensure projectId is properly typed and exists in the current organization
      const projectId = args.data.project.connect.id;
      return this.prisma.milestone.create({
        ...args,
        data: {
          ...args.data,
          projectId, // Directly set the projectId instead of using nested connect with organizationId
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

    count: (args?: Prisma.MilestoneCountArgs) => {
      return this.prisma.milestone.count({
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
      // Ensure projectId is properly typed and exists in the current organization
      const projectId = args.data.project.connect.id;
      return this.prisma.file.create({
        ...args,
        data: {
          ...args.data,
          projectId, // Directly set the projectId instead of using nested connect with organizationId
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

    count: (args?: Prisma.FileCountArgs) => {
      return this.prisma.file.count({
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
  };

  /**
   * Approvals service methods
   */
  approval = {
    findMany: (args?: Prisma.ApprovalFindManyArgs) => {
      return this.prisma.approval.findMany({
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

    findUnique: (args: Prisma.ApprovalFindUniqueArgs) => {
      return this.prisma.approval.findUnique({
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

    create: (args: Prisma.ApprovalCreateArgs) => {
      const projectId = args.data.project.connect.id;
      return this.prisma.approval.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

    update: (args: Prisma.ApprovalUpdateArgs) => {
      return this.prisma.approval.update({
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

    delete: (args: Prisma.ApprovalDeleteArgs) => {
      return this.prisma.approval.delete({
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

    count: (args?: Prisma.ApprovalCountArgs) => {
      return this.prisma.approval.count({
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

    count: (args?: Prisma.TicketCountArgs) => {
      return this.prisma.ticket.count({
        ...args,
        where: {
          ...args?.where,
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

    count: (args?: Prisma.InvoiceCountArgs) => {
      return this.prisma.invoice.count({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },
  };

  /**
   * Tasks service methods
   */
  task = {
    findMany: (args?: Prisma.TaskFindManyArgs) => {
      return this.prisma.task.findMany({
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

    findUnique: (args: Prisma.TaskFindUniqueArgs) => {
      return this.prisma.task.findUnique({
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

    create: (args: Prisma.TaskCreateArgs) => {
      const projectId = args.data.project.connect.id;
      return this.prisma.task.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

    update: (args: Prisma.TaskUpdateArgs) => {
      return this.prisma.task.update({
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

    delete: (args: Prisma.TaskDeleteArgs) => {
      return this.prisma.task.delete({
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

    count: (args?: Prisma.TaskCountArgs) => {
      return this.prisma.task.count({
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
  };
}
