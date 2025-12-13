// Common types for the JasaWeb platform

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization extends BaseEntity {
  name: string;
  domain?: string;
  settings?: Record<string, unknown>;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: string;
  organizationId: string;
  profilePicture?: string;
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  status: string;
  organizationId: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export interface Milestone extends BaseEntity {
  title: string;
  description?: string;
  status: string;
  projectId: string;
  dueDate?: Date;
  completedAt?: Date;
}

export interface Ticket extends BaseEntity {
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  resolvedAt?: Date;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  amount: number;
  status: string;
  projectId: string;
  clientId?: string;
  dueDate?: Date;
  paidAt?: Date;
}

export interface File extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  projectId: string;
  uploadedById: string;
}

export interface Approval extends BaseEntity {
  itemType: string;
  itemId: string;
  status: string;
  projectId: string;
  requesterId: string;
  reviewerId?: string;
  comments?: string;
  reviewedAt?: Date;
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  userId?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WhereClause {
  organizationId: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenIdentifier: string;
  expiresAt: Date;
}
