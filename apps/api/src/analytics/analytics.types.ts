import { User, Project, Invoice, Ticket, AuditLog } from '@prisma/client';

// Project-related types
export interface ProjectWithRelations extends Project {
  milestones: Array<{
    id: string;
    status: string;
    title: string;
    dueAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tasks: Array<{
    id: string;
    status: string;
    title: string;
    assigneeId?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  approvals: Array<{
    id: string;
    status: string;
    itemType: string;
    itemId: string;
    decidedById?: string;
    decidedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tickets: Array<{
    id: string;
    status: string;
    priority: string;
    type: string;
    assigneeId?: string;
    slaDueAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    issuedAt: Date;
    dueAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

// User-related types
export interface UserWithRelations extends User {
  memberships: Array<{
    id: string;
    organizationId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  Task: Array<{
    id: string;
    status: string;
    title: string;
    projectId: string;
    assigneeId?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  approvals: Array<{
    id: string;
    status: string;
    itemType: string;
    itemId: string;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tickets: Array<{
    id: string;
    status: string;
    priority: string;
    type: string;
    organizationId: string;
    assigneeId?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

// Invoice-related types
export interface InvoiceWithProject extends Invoice {
  project: {
    id: string;
    name: string;
    status: string;
    organizationId: string;
  };
}

// Ticket-related types
export interface TicketWithRelations extends Ticket {
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
    status: string;
  };
}

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
export interface ProjectWhereClause {
  organizationId: string;
  id?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface UserWhereClause {
  id?: string;
  memberships: {
    some: {
      organizationId: string;
    };
  };
}

export interface InvoiceWhereClause {
  organizationId: string;
  projectId?: string;
  issuedAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface TicketWhereClause {
  organizationId: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

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
