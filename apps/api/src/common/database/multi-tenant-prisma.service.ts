import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
<<<<<<< HEAD
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
=======
import { PrismaService } from '../database/prisma.service';
>>>>>>> origin/main

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
<<<<<<< HEAD
    findMany: (args?: Prisma.ProjectFindManyArgs) => {
=======
    findMany: (args?: any) => {
>>>>>>> origin/main
      return this.prisma.project.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    findUnique: (args: Prisma.ProjectFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
      return this.prisma.project.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    create: (args: Prisma.ProjectCreateArgs) => {
=======
    create: (args: any) => {
>>>>>>> origin/main
      return this.prisma.project.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    update: (args: Prisma.ProjectUpdateArgs) => {
=======
    update: (args: any) => {
>>>>>>> origin/main
      return this.prisma.project.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

<<<<<<< HEAD
    delete: (args: Prisma.ProjectDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
      return this.prisma.project.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    count: (args?: Prisma.ProjectCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
<<<<<<< HEAD
   * Milestones service methods
   */
  milestone = {
    findMany: (args?: Prisma.MilestoneFindManyArgs) => {
=======
   * Users service methods
   */
  user = {
    findUnique: (args: any) => {
      return this.prisma.user.findFirst({
        ...args,
        where: {
          AND: [args.where ?? {}, { memberships: { some: { organizationId: this.organizationId } } }],
        },
      });
    },

    findMany: (args?: any) => {
      return this.prisma.user.findMany({
        ...args,
        where: {
          AND: [args?.where ?? {}, { memberships: { some: { organizationId: this.organizationId } } }],
        },
      });
    },
  };

  /**
   * Milestones service methods
   */
  milestone = {
    findMany: (args?: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    findUnique: (args: Prisma.MilestoneFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
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
=======
    create: (args: any) => {
      if ('projectId' in args.data && !(args.data as any).project) {
        const { projectId, ...rest } = args.data as any;
        if (!projectId) {
          throw new BadRequestException('Milestone creation requires a project reference.');
        }

        return this.prisma.milestone.create({
          ...args,
          data: {
            ...rest,
            project: {
              connect: { id: projectId },
            },
          },
        });
      }

      return this.prisma.milestone.create(args);
    },

    update: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    delete: (args: Prisma.MilestoneDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    count: (args?: Prisma.MilestoneCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
<<<<<<< HEAD
    findMany: (args?: Prisma.FileFindManyArgs) => {
=======
    findMany: (args?: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    findUnique: (args: Prisma.FileFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
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
=======
    create: (args: any) => {
      if ('projectId' in args.data && !(args.data as any).project) {
        const { projectId, ...rest } = args.data as any;
        if (!projectId) {
          throw new BadRequestException('File creation requires a project reference.');
        }

        return this.prisma.file.create({
          ...args,
          data: {
            ...rest,
            project: {
              connect: { id: projectId },
            },
          },
        });
      }

      return this.prisma.file.create(args);
    },

    update: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    delete: (args: Prisma.FileDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    count: (args?: Prisma.FileCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
<<<<<<< HEAD
    findMany: (args?: Prisma.ApprovalFindManyArgs) => {
=======
    findMany: (args?: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    findUnique: (args: Prisma.ApprovalFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    create: (args: Prisma.ApprovalCreateArgs) => {
=======
    create: (args: any) => {
>>>>>>> origin/main
      const projectId = args.data.project.connect.id;
      return this.prisma.approval.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

<<<<<<< HEAD
    update: (args: Prisma.ApprovalUpdateArgs) => {
=======
    update: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    delete: (args: Prisma.ApprovalDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    count: (args?: Prisma.ApprovalCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
<<<<<<< HEAD
    findMany: (args?: Prisma.TicketFindManyArgs) => {
=======
    findMany: (args?: any) => {
>>>>>>> origin/main
      return this.prisma.ticket.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    findUnique: (args: Prisma.TicketFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
      return this.prisma.ticket.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    create: (args: Prisma.TicketCreateArgs) => {
=======
    create: (args: any) => {
>>>>>>> origin/main
      return this.prisma.ticket.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    update: (args: Prisma.TicketUpdateArgs) => {
=======
    update: (args: any) => {
>>>>>>> origin/main
      return this.prisma.ticket.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

<<<<<<< HEAD
    delete: (args: Prisma.TicketDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
      return this.prisma.ticket.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    count: (args?: Prisma.TicketCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
<<<<<<< HEAD
    findMany: (args?: Prisma.InvoiceFindManyArgs) => {
=======
    findMany: (args?: any) => {
>>>>>>> origin/main
      return this.prisma.invoice.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    findUnique: (args: Prisma.InvoiceFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
      return this.prisma.invoice.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    create: (args: Prisma.InvoiceCreateArgs) => {
=======
    create: (args: any) => {
>>>>>>> origin/main
      return this.prisma.invoice.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    update: (args: Prisma.InvoiceUpdateArgs) => {
=======
    update: (args: any) => {
>>>>>>> origin/main
      return this.prisma.invoice.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

<<<<<<< HEAD
    delete: (args: Prisma.InvoiceDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
      return this.prisma.invoice.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

<<<<<<< HEAD
    count: (args?: Prisma.InvoiceCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
<<<<<<< HEAD
    findMany: (args?: Prisma.TaskFindManyArgs) => {
=======
    findMany: (args?: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    findUnique: (args: Prisma.TaskFindUniqueArgs) => {
=======
    findUnique: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    create: (args: Prisma.TaskCreateArgs) => {
=======
    create: (args: any) => {
>>>>>>> origin/main
      const projectId = args.data.project.connect.id;
      return this.prisma.task.create({
        ...args,
        data: {
          ...args.data,
          projectId,
        },
      });
    },

<<<<<<< HEAD
    update: (args: Prisma.TaskUpdateArgs) => {
=======
    update: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    delete: (args: Prisma.TaskDeleteArgs) => {
=======
    delete: (args: any) => {
>>>>>>> origin/main
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

<<<<<<< HEAD
    count: (args?: Prisma.TaskCountArgs) => {
=======
    count: (args?: any) => {
>>>>>>> origin/main
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
