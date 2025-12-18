import { Prisma } from '@prisma/client';

// Project-related types
export interface ProjectWithRelations extends Prisma.ProjectGetPayload<{
  include: {
    milestones: true;
    tasks: true;
    approvals: true;
    tickets: true;
    invoices: true;
  };
}> {}

// User-related types
export interface UserWithRelations extends Prisma.UserGetPayload<{
  include: {
    memberships: {
      where: { organizationId: string };
    };
    assignedTasks: {
      where: {
        project: {
          organizationId: string;
        };
      };
    };
    approvals: {
      where: {
        project: {
          organizationId: string;
        };
      };
    };
    tickets: {
      where: {
        organizationId: string;
      };
    };
  };
}> {}

// Invoice-related types
export interface InvoiceWithProject extends Prisma.InvoiceGetPayload<{
  include: {
    project: true;
  };
}> {}

// Ticket-related types
export interface TicketWithRelations extends Prisma.TicketGetPayload<{
  include: {
    assignee: true;
    project: true;
  };
}> {}

// Audit Log types
export interface AuditLogWithAction extends AuditLog {
  action:
    | 'user_login'
    | 'file_upload'
    | 'approval_request'
    | 'project_created'
    | 'task_completed'
    | string;
}

// Filter types
export interface DateRangeFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface ProjectFilters extends DateRangeFilters {
  projectId?: string;
}

export interface TeamPerformanceFilters extends DateRangeFilters {
  userId?: string;
}

export interface FinancialFilters extends DateRangeFilters {
  projectId?: string;
}

export interface ActivityTrendsFilters extends DateRangeFilters {
  granularity?: 'day' | 'week' | 'month';
}

// Prisma Where Clause types
export type ProjectWhereClause = Prisma.ProjectWhereInput;

export type UserWhereClause = Prisma.UserWhereInput;

export type InvoiceWhereClause = Prisma.InvoiceWhereInput;

export type TicketWhereClause = Prisma.TicketWhereInput;

// Analytics return types
export interface ProjectAnalytics {
  summary: {
    totalProjects: number;
    completedProjects: number;
    inProgressProjects: number;
    overdueProjects: number;
    completionRate: number;
    onTimeDeliveryRate: number;
  };
  milestones: {
    total: number;
    completed: number;
    completionRate: number;
  };
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
}

export interface TeamPerformanceAnalytics {
  userId: string;
  name: string | null;
  email: string;
  role: string | undefined;
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
  approvals: {
    total: number;
    completed: number;
    completionRate: number;
  };
  tickets: {
    total: number;
    resolved: number;
    resolutionRate: number;
  };
}

export interface FinancialAnalytics {
  summary: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    paymentRate: number;
    overdueCount: number;
  };
  byCurrency: Record<string, { count: number; amount: number; paid: number }>;
  byMonth: Record<string, { count: number; amount: number; paid: number }>;
}

export interface ClientInsightsAnalytics {
  summary: {
    totalTickets: number;
    resolvedTickets: number;
    resolutionRate: number;
    slaComplianceRate: number;
  };
  byType: Record<string, { total: number; resolved: number }>;
  byPriority: {
    critical: { total: number; resolved: number };
    high: { total: number; resolved: number };
    medium: { total: number; resolved: number };
    low: { total: number; resolved: number };
  };
}

export interface ActivityTrendData {
  date: string;
  total: number;
  user_login: number;
  file_upload: number;
  approval_request: number;
  project_created: number;
  task_completed: number;
  [key: string]: number | string; // Allow dynamic action keys
}

export interface OverviewAnalytics {
  projects: ProjectAnalytics;
  teamPerformance: TeamPerformanceAnalytics[];
  financial: FinancialAnalytics;
  clientInsights: ClientInsightsAnalytics;
}
