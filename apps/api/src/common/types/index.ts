// Common types used across the application

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  milestones?: Milestone[];
  tasks?: Task[];
  approvals?: Approval[];
  tickets?: Ticket[];
  invoices?: Invoice[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Approval {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  projectId: string;
  requesterId: string;
  approverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  assigneeId?: string;
  organizationId: string;
  slaDueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  projectId?: string;
  organizationId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'developer' | 'client';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics specific types
export interface ProjectAnalytics {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime?: number;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  paidInvoices: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  revenueByMonth: Record<string, number>;
}

export interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  highTickets: number;
  mediumTickets: number;
  lowTickets: number;
  overdueTickets: number;
  averageResolutionTime?: number;
  ticketsByPriority: Record<string, number>;
}

// Database query types
export interface WhereClause {
  organizationId: string;
  id?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  status?: string | string[];
  [key: string]: any;
}

// Socket.io types
export interface SocketData {
  [event: string]: any;
}

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

// Error handling types
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  path?: string;
  errorId?: string;
  timestamp: string;
}

// Request types
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
  organizationId: string;
}
