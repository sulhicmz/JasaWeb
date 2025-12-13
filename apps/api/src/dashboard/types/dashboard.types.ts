export interface Project {
  id: string;
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  milestones?: Milestone[];
  tickets?: Ticket[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithMetrics extends Project {
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  openTickets: number;
  highPriorityTickets: number;
  completionRate?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalMilestones: number;
  completedMilestones: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export interface AnalyticsData {
  period: string;
  projects: number;
  tickets: number;
  invoices: number;
  milestones: number;
}

export interface NotificationPreferences {
  email: {
    projects: boolean;
    tickets: boolean;
    invoices: boolean;
    milestones: boolean;
  };
  inApp: {
    projects: boolean;
    tickets: boolean;
    invoices: boolean;
    milestones: boolean;
  };
  desktop: {
    projects: boolean;
    tickets: boolean;
    invoices: boolean;
    milestones: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  digest: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}
