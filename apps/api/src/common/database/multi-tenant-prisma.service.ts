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

    findFirst: (args?: any) => {
      return this.prisma.task.findFirst({
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
      return this.prisma.task.findUnique(args);
    },

    create: (args: any) => {
      return this.prisma.task.create(args);
    },

    update: (args: any) => {
      return this.prisma.task.update(args);
    },

    delete: (args: any) => {
      return this.prisma.task.delete(args);
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

    aggregate: (args?: any) => {
      return this.prisma.task.aggregate({
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
   * Membership service methods
   */
  membership = {
    findUnique: (args: any) => {
      return this.prisma.membership.findUnique(args);
    },

    findMany: (args?: any) => {
      return this.prisma.membership.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: any) => {
      return this.prisma.membership.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: any) => {
      return this.prisma.membership.update(args);
    },

    delete: (args: any) => {
      return this.prisma.membership.delete(args);
    },

    count: (args?: any) => {
      return this.prisma.membership.count({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },
  };

  /**
   * Task Comments service methods
   */
  taskComment = {
    findMany: (args?: any) => {
      return this.prisma.taskComment.findMany({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.taskComment.findUnique(args);
    },

    create: (args: any) => {
      return this.prisma.taskComment.create(args);
    },

    update: (args: any) => {
      return this.prisma.taskComment.update(args);
    },

    delete: (args: any) => {
      return this.prisma.taskComment.delete(args);
    },

    count: (args?: any) => {
      return this.prisma.taskComment.count({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },
  };

  /**
   * Time Entries service methods
   */
  timeEntry = {
    findMany: (args?: any) => {
      return this.prisma.timeEntry.findMany({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.timeEntry.findUnique(args);
    },

    create: (args: any) => {
      return this.prisma.timeEntry.create(args);
    },

    update: (args: any) => {
      return this.prisma.timeEntry.update(args);
    },

    delete: (args: any) => {
      return this.prisma.timeEntry.delete(args);
    },

    aggregate: (args?: any) => {
      return this.prisma.timeEntry.aggregate({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    count: (args?: any) => {
      return this.prisma.timeEntry.count({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },
  };

  /**
   * Task Dependencies service methods
   */
  taskDependency = {
    findMany: (args?: any) => {
      return this.prisma.taskDependency.findMany({
        ...args,
        where: {
          ...args?.where,
          dependentTask: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.taskDependency.findUnique(args);
    },

    create: (args: any) => {
      return this.prisma.taskDependency.create(args);
    },

    update: (args: any) => {
      return this.prisma.taskDependency.update(args);
    },

    delete: (args: any) => {
      return this.prisma.taskDependency.delete(args);
    },

    count: (args?: any) => {
      return this.prisma.taskDependency.count({
        ...args,
        where: {
          ...args?.where,
          dependentTask: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },
  };

  /**
   * Task Watchers service methods
   */
  taskWatcher = {
    findMany: (args?: any) => {
      return this.prisma.taskWatcher.findMany({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    findUnique: (args: any) => {
      return this.prisma.taskWatcher.findUnique(args);
    },

    create: (args: any) => {
      return this.prisma.taskWatcher.create(args);
    },

    upsert: (args: any) => {
      return this.prisma.taskWatcher.upsert(args);
    },

    update: (args: any) => {
      return this.prisma.taskWatcher.update(args);
    },

    delete: (args: any) => {
      return this.prisma.taskWatcher.delete(args);
    },

    count: (args?: any) => {
      return this.prisma.taskWatcher.count({
        ...args,
        where: {
          ...args?.where,
          task: {
            project: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },
  };
}
