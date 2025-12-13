// Common types used across the UI components

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface SizeVariant {
  sm: string;
  md: string;
  lg: string;
}

export interface ColorVariant {
  default: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface StatusVariant {
  active: string;
  inactive: string;
  pending: string;
  completed: string;
  failed: string;
}

// Dashboard specific types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  dueDate: Date;
  assignee?: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'ticket' | 'invoice' | 'milestone' | 'file';
  action: string;
  description: string;
  user: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
