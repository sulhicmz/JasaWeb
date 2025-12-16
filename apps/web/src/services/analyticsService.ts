export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  userId?: string;
  granularity?: 'day' | 'week' | 'month';
}

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
  name: string;
  email: string;
  role: string;
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

export interface ActivityTrend {
  date: string;
  total: number;
  user_login: number;
  file_upload: number;
  approval_request: number;
  project_created: number;
  task_completed: number;
}

export interface OverviewAnalytics {
  projects: ProjectAnalytics;
  teamPerformance: TeamPerformanceAnalytics[];
  financial: FinancialAnalytics;
  clientInsights: ClientInsightsAnalytics;
}

export class AnalyticsService {
  private baseUrl = '/api/analytics';

  private async fetchWithAuth(endpoint: string, params?: AnalyticsFilters) {
    const token = localStorage.getItem('authToken');
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getProjectAnalytics(
    filters?: AnalyticsFilters
  ): Promise<ProjectAnalytics> {
    return this.fetchWithAuth('/projects', filters);
  }

  async getTeamPerformanceAnalytics(
    filters?: AnalyticsFilters
  ): Promise<TeamPerformanceAnalytics[]> {
    return this.fetchWithAuth('/team-performance', filters);
  }

  async getFinancialAnalytics(
    filters?: AnalyticsFilters
  ): Promise<FinancialAnalytics> {
    return this.fetchWithAuth('/financial', filters);
  }

  async getClientInsightsAnalytics(
    filters?: AnalyticsFilters
  ): Promise<ClientInsightsAnalytics> {
    return this.fetchWithAuth('/client-insights', filters);
  }

  async getActivityTrends(
    filters?: AnalyticsFilters
  ): Promise<ActivityTrend[]> {
    return this.fetchWithAuth('/activity-trends', filters);
  }

  async getOverviewAnalytics(
    filters?: AnalyticsFilters
  ): Promise<OverviewAnalytics> {
    return this.fetchWithAuth('/overview', filters);
  }

  // Export functionality
  async exportData(
    type: 'pdf' | 'excel' | 'csv',
    data: unknown,
    filename?: string
  ) {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${this.baseUrl}/export/${type}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`Export error: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = type === 'excel' ? 'xlsx' : type;
    a.download =
      filename ||
      `analytics-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const analyticsService = new AnalyticsService();
