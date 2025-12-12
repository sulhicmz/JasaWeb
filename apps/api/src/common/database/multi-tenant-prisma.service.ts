import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from './prisma.service';

/**
 * Service that wraps Prisma to enforce multi-tenant data isolation
 * This service intercepts Prisma operations to ensure they're scoped to the current organization
 */
@Injectable({ scope: Scope.REQUEST })
export class MultiTenantPrismaService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any
  ) {}

  /**
   * Helper method to get the current organization ID
   */
  private get organizationId(): string {
    const orgId = (this.request as any).organizationId;
    if (!orgId) {
      throw new BadRequestException(
        'Organization context not found. Please ensure multi-tenant middleware is applied.'
      );
    }
    return orgId;
  }

  /**
   * Projects service methods
   */
  project = {
    findMany: (args?: any) => {
      return this.prisma.project.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.project.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: any) => {
      return this.prisma.project.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: any) => {
      return this.prisma.project.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: any) => {
      return this.prisma.project.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: any) => {
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
    findMany: (args?: any) => {
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

    findUnique: (args: any) => {
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

    create: (args: any) => {
      const projectId = args.data.project.connect.id;
      return this.prisma.milestone.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

    update: (args: any) => {
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

    delete: (args: any) => {
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

    count: (args?: any) => {
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
    findMany: (args?: any) => {
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

    findUnique: (args: any) => {
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

    create: (args: any) => {
      const projectId = args.data.project.connect.id;
      return this.prisma.file.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

    update: (args: any) => {
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

    delete: (args: any) => {
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

    count: (args?: any) => {
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
    findMany: (args?: any) => {
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

    findUnique: (args: any) => {
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

    create: (args: any) => {
      const projectId = args.data.project.connect.id;
      return this.prisma.approval.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

    update: (args: any) => {
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

    delete: (args: any) => {
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

    count: (args?: any) => {
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
    findMany: (args?: any) => {
      return this.prisma.ticket.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.ticket.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: any) => {
      return this.prisma.ticket.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: any) => {
      return this.prisma.ticket.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: any) => {
      return this.prisma.ticket.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: any) => {
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
    findMany: (args?: any) => {
      return this.prisma.invoice.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.invoice.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: any) => {
      return this.prisma.invoice.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: any) => {
      return this.prisma.invoice.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: any) => {
      return this.prisma.invoice.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: any) => {
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
   * Users service methods
   */
  user = {
    findMany: (args?: any) => {
      return this.prisma.user.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.user.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: any) => {
      return this.prisma.user.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: any) => {
      return this.prisma.user.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: any) => {
      return this.prisma.user.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: any) => {
      return this.prisma.user.count({
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
    findMany: (args?: any) => {
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

    findUnique: (args: any) => {
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

    create: (args: any) => {
      const projectId = args.data.project.connect.id;
      return this.prisma.task.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

    update: (args: any) => {
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

    delete: (args: any) => {
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

    count: (args?: any) => {
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
