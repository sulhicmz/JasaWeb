// Project Analytics Service for frontend
export interface ProjectAnalyticsData {
  metrics: {
    projectId: string;
    projectName: string;
    healthScore: number;
    performanceScore: number;
    budgetUtilization: number;
    timelineAdherence: number;
    teamProductivity: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    milestonesCompleted: number;
    milestonesTotal: number;
    ticketsResolved: number;
    ticketsOpen: number;
    avgResolutionTime: number;
    forecastedCompletion: string;
    budgetVariance: number;
    teamVelocity: number;
    lastUpdated: string;
  };
  trends: Array<{
    date: string;
    healthScore: number;
    progress: number;
    budgetBurn: number;
    teamCapacity: number;
  }>;
  forecast: {
    expectedCompletion: string;
    confidence: number;
    riskFactors: string[];
    recommendedActions: string[];
    budgetProjection: number;
    timelineVariance: number;
  };
  teamProductivity: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgTaskDuration: number;
    contributionScore: number;
    availability: number;
    workload: 'optimal' | 'overloaded' | 'underutilized';
  }>;
  recommendations: string[];
}

class ProjectAnalyticsService {
  private baseUrl = '/api/analytics/projects';
  private cache = new Map<
    string,
    { data: ProjectAnalyticsData; timestamp: number }
  >();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getProjectAnalytics(
    projectId: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<ProjectAnalyticsData> {
    const cacheKey = `${projectId}-${timeRange}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?projectId=${projectId}&timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw error;
    }
  }

  async getProjectHealthScore(projectId: string): Promise<{
    projectId: string;
    healthScore: number;
    riskLevel: string;
    lastUpdated: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/health-score?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching health score:', error);
      throw error;
    }
  }

  async getProjectForecast(projectId: string): Promise<{
    projectId: string;
    forecast: any;
    recommendations: string[];
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  async getTeamProductivity(projectId: string): Promise<{
    projectId: string;
    teamProductivity: any[];
    overallProductivity: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/team-productivity?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching team productivity:', error);
      throw error;
    }
  }

  async getProjectTrends(
    projectId: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    projectId: string;
    timeRange: string;
    trends: Array<{
      date: string;
      healthScore: number;
      progress: number;
      budgetBurn: number;
      teamCapacity: number;
    }>;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/trends?projectId=${projectId}&timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  }

  // Utility methods
  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Calculate health score color
  getHealthScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  // Get risk level color
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  // Format percentage
  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Calculate trend direction
  getTrendDirection(
    current: number,
    previous: number
  ): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% threshold
    const change = (current - previous) / previous;

    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  // Get trend icon
  getTrendIcon(direction: 'up' | 'down' | 'stable'): string {
    switch (direction) {
      case 'up':
        return 'fas fa-arrow-up text-green-400';
      case 'down':
        return 'fas fa-arrow-down text-red-400';
      case 'stable':
        return 'fas fa-minus text-gray-400';
      default:
        return 'fas fa-minus text-gray-400';
    }
  }
}

// Export singleton instance
export const projectAnalyticsService = new ProjectAnalyticsService();

// Make available globally for components
if (typeof window !== 'undefined') {
  (window as any).projectAnalyticsService = projectAnalyticsService;
}
