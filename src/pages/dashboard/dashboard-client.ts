/**
 * Client-side Dashboard Controller
 * Handles dashboard interactions using existing DashboardService business logic
 */

interface DashboardStatsResponse {
  success: boolean;
  data: {
    totalProjects: number;
    inProgress: number;
    completed: number;
    unpaidInvoices: number;
  };
}

/**
 * Dashboard Client Controller - Client-side dashboard interactions
 * Follows atomic modularity principles by using existing service layer
 */
export class DashboardClientController {
  
  /**
   * Load dashboard statistics from API
   * Centralizes API call logic that was previously inline
   */
  static async loadDashboardStats(): Promise<DashboardStatsResponse | null> {
    try {
      const response = await fetch('/api/client/dashboard');
      
      if (!response.ok) {
        console.error('Dashboard API request failed:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Dashboard API returned error:', data);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      return null;
    }
  }

  /**
   * Update dashboard UI with statistics
   * Separates DOM manipulation from business logic
   */
  static updateDashboardStats(stats: DashboardStatsResponse['data']): void {
    const statElements = {
      projectCount: stats.totalProjects,
      inProgressCount: stats.inProgress,
      completedCount: stats.completed,
      unpaidCount: stats.unpaidInvoices
    };

    Object.entries(statElements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value.toString();
      } else {
        console.warn(`Dashboard stat element not found: ${elementId}`);
      }
    });
  }

  /**
   * Handle dashboard loading error state
   * Centralizes error handling logic
   */
  static handleLoadError(): void {
    const errorElementIds = ['projectCount', 'inProgressCount', 'completedCount', 'unpaidCount'];
    
    errorElementIds.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = 'Error';
      }
    });
  }

  /**
   * Initialize dashboard on page load
   * Replaces the inline loadDashboardData function
   */
  static async initializeDashboard(): Promise<void> {
    const data = await this.loadDashboardStats();
    
    if (data) {
      this.updateDashboardStats(data.data);
    } else {
      this.handleLoadError();
    }
  }
}

// Auto-initialize dashboard when DOM is loaded
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    DashboardClientController.initializeDashboard();
  });
} else if (typeof window !== 'undefined') {
  // DOM already loaded, initialize immediately
  DashboardClientController.initializeDashboard();
}

// Module auto-initializes when imported - no default export needed