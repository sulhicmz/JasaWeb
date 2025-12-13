import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

interface RequestWithOrganization {
  organizationId: string;
  user?: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
  };
}

type UserCreateArgs = Prisma.UserCreateArgs;

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

// File types
type FileFindManyArgs = Omit<Prisma.FileFindManyArgs, 'where'> & {
  where?: Omit<Prisma.FileWhereInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type FileFindUniqueArgs = Omit<Prisma.FileFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.FileWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type FileCreateArgs = Omit<Prisma.FileCreateArgs, 'data'> & {
  data: Prisma.FileCreateInput;
};

type FileUpdateArgs = Omit<Prisma.FileUpdateArgs, 'where' | 'data'> & {
  where: Omit<Prisma.FileWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
  data: Prisma.FileUpdateInput;
};

type FileDeleteArgs = Omit<Prisma.FileDeleteArgs, 'where'> & {
  where: Omit<Prisma.FileWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type FileCountArgs = Omit<Prisma.FileCountArgs, 'where'> & {
  where?: Omit<Prisma.FileWhereInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

// Approval types
type ApprovalFindManyArgs = Omit<Prisma.ApprovalFindManyArgs, 'where'> & {
  where?: Omit<Prisma.ApprovalWhereInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type ApprovalFindUniqueArgs = Omit<Prisma.ApprovalFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.ApprovalWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type ApprovalCreateArgs = Omit<Prisma.ApprovalCreateArgs, 'data'> & {
  data: Prisma.ApprovalCreateInput;
};

type ApprovalUpdateArgs = Omit<Prisma.ApprovalUpdateArgs, 'where' | 'data'> & {
  where: Omit<Prisma.ApprovalWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
  data: Prisma.ApprovalUpdateInput;
};

type ApprovalDeleteArgs = Omit<Prisma.ApprovalDeleteArgs, 'where'> & {
  where: Omit<Prisma.ApprovalWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type ApprovalCountArgs = Omit<Prisma.ApprovalCountArgs, 'where'> & {
  where?: Omit<Prisma.ApprovalWhereInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

// Ticket types
type TicketFindManyArgs = Omit<Prisma.TicketFindManyArgs, 'where'> & {
  where?: Omit<Prisma.TicketWhereInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type TicketFindUniqueArgs = Omit<Prisma.TicketFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.TicketWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type TicketCreateArgs = Omit<Prisma.TicketCreateArgs, 'data'> & {
  data: Omit<Prisma.TicketUncheckedCreateInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type TicketUpdateArgs = Omit<Prisma.TicketUpdateArgs, 'where' | 'data'> & {
  where: Omit<Prisma.TicketWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
  data: Prisma.TicketUpdateInput;
};

type TicketDeleteArgs = Omit<Prisma.TicketDeleteArgs, 'where'> & {
  where: Omit<Prisma.TicketWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type TicketCountArgs = Omit<Prisma.TicketCountArgs, 'where'> & {
  where?: Omit<Prisma.TicketWhereInput, 'organizationId'> & {
    organizationId?: string;
  };
};

// Invoice types
type InvoiceFindManyArgs = Omit<Prisma.InvoiceFindManyArgs, 'where'> & {
  where?: Omit<Prisma.InvoiceWhereInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type InvoiceFindUniqueArgs = Omit<Prisma.InvoiceFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.InvoiceWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type InvoiceCreateArgs = Omit<Prisma.InvoiceCreateArgs, 'data'> & {
  data: Omit<Prisma.InvoiceUncheckedCreateInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type InvoiceUpdateArgs = Omit<Prisma.InvoiceUpdateArgs, 'where' | 'data'> & {
  where: Omit<Prisma.InvoiceWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
  data: Prisma.InvoiceUpdateInput;
};

type InvoiceDeleteArgs = Omit<Prisma.InvoiceDeleteArgs, 'where'> & {
  where: Omit<Prisma.InvoiceWhereUniqueInput, 'organizationId'> & {
    organizationId?: string;
  };
};

type InvoiceCountArgs = Omit<Prisma.InvoiceCountArgs, 'where'> & {
  where?: Omit<Prisma.InvoiceWhereInput, 'organizationId'> & {
    organizationId?: string;
  };
};

// User types
type UserFindManyArgs = Omit<Prisma.UserFindManyArgs, 'where'> & {
  where?: Omit<Prisma.UserWhereInput, 'memberships'> & {
    memberships?: Omit<Prisma.MembershipWhereInput, 'organization'> & {
      organization?: Omit<Prisma.OrganizationWhereInput, 'id'> & {
        id?: string;
      };
    };
  };
};

type UserCountArgs = Omit<Prisma.UserCountArgs, 'where'> & {
  where?: Omit<Prisma.UserWhereInput, 'memberships'> & {
    memberships?: Omit<Prisma.MembershipWhereInput, 'organization'> & {
      organization?: Omit<Prisma.OrganizationWhereInput, 'id'> & {
        id?: string;
      };
    };
  };
};

// Task types
type TaskFindManyArgs = Omit<Prisma.TaskFindManyArgs, 'where'> & {
  where?: Omit<Prisma.TaskWhereInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type TaskFindUniqueArgs = Omit<Prisma.TaskFindUniqueArgs, 'where'> & {
  where: Omit<Prisma.TaskWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type TaskCreateArgs = Omit<Prisma.TaskCreateArgs, 'data'> & {
  data: Prisma.TaskCreateInput;
};

type TaskUpdateArgs = Omit<Prisma.TaskUpdateArgs, 'where' | 'data'> & {
  where: Omit<Prisma.TaskWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
  data: Prisma.TaskUpdateInput;
};

type TaskDeleteArgs = Omit<Prisma.TaskDeleteArgs, 'where'> & {
  where: Omit<Prisma.TaskWhereUniqueInput, 'project'> & {
    project?: Omit<Prisma.ProjectWhereInput, 'organizationId'> & {
      organizationId?: string;
    };
  };
};

type TaskCountArgs = Omit<Prisma.TaskCountArgs, 'where'> & {
  where?: Omit<Prisma.TaskWhereInput, 'project'> & {
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
    findMany: (args?: FileFindManyArgs) => {
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

    findUnique: (args: FileFindUniqueArgs) => {
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

    create: (args: FileCreateArgs) => {
      const projectConnect = args.data.project as { connect?: { id: string } };
      const projectId = projectConnect?.connect?.id;
      if (!projectId) {
        throw new BadRequestException(
          'Project connection is required for file creation'
        );
      }
      return this.prisma.file.create({
        data: {
          folder: args.data.folder,
          filename: args.data.filename,
          version: args.data.version,
          size: args.data.size,
          checksum: args.data.checksum,
          uploadedBy: args.data.uploadedBy,
          project: {
            connect: { id: projectId },
          },
        },
      });
    },

    update: (args: FileUpdateArgs) => {
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

    delete: (args: FileDeleteArgs) => {
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

    count: (args?: FileCountArgs) => {
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
    findMany: (args?: ApprovalFindManyArgs) => {
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

    findUnique: (args: ApprovalFindUniqueArgs) => {
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

    create: (args: ApprovalCreateArgs) => {
      const projectConnect = args.data.project as { connect?: { id: string } };
      const projectId = projectConnect?.connect?.id;
      if (!projectId) {
        throw new BadRequestException(
          'Project connection is required for approval creation'
        );
      }
      return this.prisma.approval.create({
        data: {
          itemType: args.data.itemType,
          itemId: args.data.itemId,
          status: args.data.status,
          decidedBy: args.data.decidedBy,
          decidedAt: args.data.decidedAt,
          note: args.data.note,
          project: {
            connect: { id: projectId },
          },
        },
      });
    },

    update: (args: ApprovalUpdateArgs) => {
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

    delete: (args: ApprovalDeleteArgs) => {
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

    count: (args?: ApprovalCountArgs) => {
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
    findMany: (args?: TicketFindManyArgs) => {
      return this.prisma.ticket.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: TicketFindUniqueArgs) => {
      return this.prisma.ticket.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: TicketCreateArgs) => {
      return this.prisma.ticket.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: TicketUpdateArgs) => {
      return this.prisma.ticket.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: TicketDeleteArgs) => {
      return this.prisma.ticket.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: TicketCountArgs) => {
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
    findMany: (args?: InvoiceFindManyArgs) => {
      return this.prisma.invoice.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId: this.organizationId,
        },
      });
    },

    findUnique: (args: InvoiceFindUniqueArgs) => {
      return this.prisma.invoice.findUnique({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    create: (args: InvoiceCreateArgs) => {
      return this.prisma.invoice.create({
        ...args,
        data: {
          ...args.data,
          organizationId: this.organizationId,
        },
      });
    },

    update: (args: InvoiceUpdateArgs) => {
      return this.prisma.invoice.update({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
        data: args.data,
      });
    },

    delete: (args: InvoiceDeleteArgs) => {
      return this.prisma.invoice.delete({
        ...args,
        where: {
          ...args.where,
          organizationId: this.organizationId,
        },
      });
    },

    count: (args?: InvoiceCountArgs) => {
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
    findMany: (args?: UserFindManyArgs) => {
      return this.prisma.user.findMany({
        ...args,
        where: {
          ...args?.where,
          memberships: {
            some: {
              organizationId: this.organizationId,
              ...args?.where?.memberships,
            },
          },
        },
      });
    },

    findUnique: (args: { where: { id: string } | { email: string } }) => {
      return this.prisma.user.findFirst({
        where: {
          ...args.where,
          memberships: {
            some: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    create: (args: UserCreateArgs) => {
      return this.prisma.user.create({
        ...args,
        data: {
          ...args.data,
          memberships: {
            create: {
              organizationId: this.organizationId,
              role: 'member',
            },
          },
        },
      });
    },

    update: (args: {
      where: { id: string } | { email: string };
      data: Prisma.UserUpdateInput;
    }) => {
      return this.prisma.user.updateMany({
        where: {
          ...args.where,
          memberships: {
            some: {
              organizationId: this.organizationId,
            },
          },
        },
        data: args.data,
      });
    },

    delete: (args: { where: { id: string } | { email: string } }) => {
      return this.prisma.user.deleteMany({
        where: {
          ...args.where,
          memberships: {
            some: {
              organizationId: this.organizationId,
            },
          },
        },
      });
    },

    count: (args?: UserCountArgs) => {
      return this.prisma.user.count({
        ...args,
        where: {
          ...args?.where,
          memberships: {
            some: {
              organizationId: this.organizationId,
              ...args?.where?.memberships,
            },
          },
        },
      });
    },
  };

  /**
   * Tasks service methods
   */
  task = {
    findMany: (args?: TaskFindManyArgs) => {
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

    findUnique: (args: TaskFindUniqueArgs) => {
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

    create: (args: TaskCreateArgs) => {
      const projectConnect = args.data.project as { connect?: { id: string } };
      const projectId = projectConnect?.connect?.id;
      if (!projectId) {
        throw new BadRequestException(
          'Project connection is required for task creation'
        );
      }
      return this.prisma.task.create({
        data: {
          title: args.data.title,
          description: args.data.description,
          assignedUser: args.data.assignedUser,
          status: args.data.status,
          dueAt: args.data.dueAt,
          labels: args.data.labels,
          createdBy: args.data.createdBy,
          project: {
            connect: { id: projectId },
          },
        },
      });
    },

    update: (args: TaskUpdateArgs) => {
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

    delete: (args: TaskDeleteArgs) => {
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

    count: (args?: TaskCountArgs) => {
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
