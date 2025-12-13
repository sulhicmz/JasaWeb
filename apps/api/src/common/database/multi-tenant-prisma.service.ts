import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  Prisma,
  Project,
  Milestone,
  Task,
  Ticket,
  Invoice,
  File,
  Approval,
  AuditLog,
  User,
  KbArticle,
  KbFeedback,
  KbSearchLog,
  RefreshToken,
  Session,
  Organization,
  Membership,
} from '@prisma/client';
import { PrismaService } from './prisma.service';

interface RequestWithOrganization {
  organizationId: string;
  user?: {
    id: string;
    email: string;
    organizationId: string;
  };
}

// Type definitions for Prisma operations
type ProjectFindManyArgs = Omit<Prisma.ProjectFindManyArgs, 'where'> & {
  where?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type ProjectFindUniqueArgs = Omit<Prisma.ProjectFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.ProjectWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type ProjectCreateArgs = Omit<Prisma.ProjectCreateArgs, 'data'> & {
  data: Omit<Prisma.ProjectUncheckedCreateInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type ProjectUpdateArgs = Omit<Prisma.ProjectUpdateArgs, 'where' | 'data'> & {
  where: Omit<Prisma.ProjectWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
  data: Prisma.ProjectUpdateInput;
};

type ProjectDeleteArgs = Omit<Prisma.ProjectDeleteArgs, 'where'> & {
  where: Omit<Prisma.ProjectWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type ProjectCountArgs = Omit<Prisma.ProjectCountArgs, 'where'> & {
  where?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
    organizationId?: string;
  };
};

// Milestone types
type MilestoneFindManyArgs = Omit<Prisma.MilestoneFindManyArgs, 'where'> & {
  where?: Omit<Prisma.MilestoneWhereInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type MilestoneFindUniqueArgs = Omit<Prisma.MilestoneFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.MilestoneWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type MilestoneCreateArgs = Omit<Prisma.MilestoneCreateArgs, 'data'> & {
  data: Prisma.MilestoneCreateInput;
};

type MilestoneUpdateArgs = Omit<
  Prisma.MilestoneUpdateArgs,
  'where' | 'data'
> & {
  where: Omit<Prisma.MilestoneWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
  data: Prisma.MilestoneUpdateInput;
};

type MilestoneDeleteArgs = Omit<Prisma.MilestoneDeleteArgs, 'where'> & {
  where: Omit<Prisma.MilestoneWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

/**
 * Service that wraps Prisma to enforce multi-tenant data isolation
 * This service intercepts Prisma operations to ensure they're scoped to the current organization
 */
@Injectable({ scope: Scope.REQUEST })
export class MultiTenantPrismaService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: RequestWithOrganization
  ) {}

  /**
   * Helper method to get the current organization ID
   */
  private get organizationId(): string {
    const orgId = this.request.organizationId;
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
    findMany: (args?: ProjectFindManyArgs) => {
      return this.prisma.project.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: ProjectFindUniqueArgs) => {
      return this.prisma.project.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: ProjectCreateArgs) => {
      return this.prisma.project.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: ProjectUpdateArgs) => {
      return this.prisma.project.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: ProjectDeleteArgs) => {
      return this.prisma.project.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: ProjectCountArgs) => {
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
    findMany: (args?: MilestoneFindManyArgs) => {
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

    findUnique: (args: MilestoneFindUniqueArgs) => {
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

    create: (args: MilestoneCreateArgs) => {
      const projectId = (
        args.data.project as Prisma.ProjectCreateNestedOneWithoutMilestonesInput
      ).connect?.id;
      if (!projectId) {
        throw new BadRequestException(
          'Project connection is required for milestone creation'
        );
      }
      return this.prisma.milestone.create({
        ...args,
        data: {
          title: args.data.title,
          dueAt: args.data.dueAt,
          status: args.data.status,
          projectId,
        },
      });
    },

    update: (args: MilestoneUpdateArgs) => {
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

    delete: (args: MilestoneDeleteArgs) => {
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

    count: (
      args?: Omit<Prisma.MilestoneCountArgs, 'where'> & {
        where?: Omit<Prisma.MilestoneWhereInput, 'project'> & {
          project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
            organizationId?: string;
          };
        };
      }
    ) => {
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
