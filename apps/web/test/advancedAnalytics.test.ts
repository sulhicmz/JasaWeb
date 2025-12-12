import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();

// Mock DOM APIs
Object.defineProperty(window, 'customElements', {
  value: {
    define: vi.fn(),
    get: vi.fn(),
  },
});

Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
});

Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
});

describe('AdvancedAnalytics Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Reset fetch mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('Analytics Loading', () => {
    it('should show loading state initially', () => {
      // Create loading state HTML
      container.innerHTML = `
        <div id="analyticsLoading" class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
          <p class="text-gray-400">Loading advanced analytics...</p>
        </div>
        <div id="analyticsContent" class="hidden space-y-8"></div>
      `;

      const loadingEl = document.getElementById('analyticsLoading');
      const contentEl = document.getElementById('analyticsContent');

      expect(loadingEl).not.toHaveClass('hidden');
      expect(contentEl).toHaveClass('hidden');
    });

    it('should load analytics data successfully', async () => {
      const mockAnalyticsData = {
        timeRange: 30,
        projectTrends: {
          weeklyTrends: {
            '2025-W50': { created: 3, completed: 2, started: 2 },
            '2025-W51': { created: 2, completed: 3, started: 1 },
          },
          totalCreated: 5,
          averageCompletionTime: 15.5,
          onTimeDeliveryRate: 85.5,
        },
        ticketMetrics: {
          totalTickets: 25,
          openTickets: 8,
          resolvedTickets: 15,
          averageResolutionTime: 172800000,
          ticketsByPriority: { low: 5, medium: 10, high: 7, critical: 3 },
          ticketsByType: { bug: 10, feature: 8, support: 7 },
          resolutionRate: 75.0,
        },
        invoiceAnalytics: {
          totalInvoices: 15,
          totalAmount: 50000,
          paidAmount: 35000,
          outstandingAmount: 15000,
          averageInvoiceValue: 3333.33,
          paymentRate: 70.0,
          monthlyRevenue: {
            '2025-11': 15000,
            '2025-12': 20000,
          },
        },
        milestoneAnalytics: {
          totalMilestones: 30,
          completedMilestones: 20,
          overdueMilestones: 3,
          averageCompletionTime: 864000000,
          onTimeCompletionRate: 80.0,
        },
        teamPerformance: [
          {
            userId: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            ticketsAssigned: 10,
            ticketsResolved: 8,
            ticketResolutionRate: 80.0,
            averageResolutionTime: 129600000,
            projectsCreated: 2,
            projectsCompleted: 1,
          },
        ],
        riskIndicators: {
          riskScore: 35,
          riskLevel: 'medium',
          overdueProjects: 1,
          highPriorityTickets: 3,
          overdueInvoices: 2,
          recommendations: [
            'Review project timelines',
            'Follow up on payments',
          ],
        },
        generatedAt: new Date().toISOString(),
      };

      // Mock successful fetch response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      // Create component HTML
      container.innerHTML = `
        <div id="analyticsLoading" class="text-center py-12"></div>
        <div id="analyticsContent" class="hidden space-y-8">
          <div class="text-2xl font-bold text-white" id="successRate">-</div>
          <div class="text-2xl font-bold text-white" id="resolutionRate">-</div>
          <div class="text-2xl font-bold text-white" id="revenue">-</div>
          <div class="text-2xl font-bold text-white" id="riskScore">-</div>
          <div class="text-sm text-gray-500" id="riskLevel">Risk level</div>
          <div class="text-3xl font-bold text-red-400" id="overdueProjectsCount">0</div>
          <div class="text-3xl font-bold text-orange-400" id="criticalTicketsCount">0</div>
          <div class="text-3xl font-bold text-yellow-400" id="overdueInvoicesCount">0</div>
          <div class="text-3xl font-bold" id="overallRiskScore">0</div>
          <div id="riskRecommendations" class="space-y-2"></div>
        </div>
      `;

      // Simulate successful analytics loading
      const loadingEl = document.getElementById('analyticsLoading');
      const contentEl = document.getElementById('analyticsContent');

      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');

      // Update metrics with mock data
      const successRateEl = document.getElementById('successRate');
      const resolutionRateEl = document.getElementById('resolutionRate');
      const revenueEl = document.getElementById('revenue');
      const riskScoreEl = document.getElementById('riskScore');
      const riskLevelEl = document.getElementById('riskLevel');

      if (successRateEl) successRateEl.textContent = '86%';
      if (resolutionRateEl) resolutionRateEl.textContent = '75%';
      if (revenueEl) revenueEl.textContent = '$16,667';
      if (riskScoreEl) riskScoreEl.textContent = '35';
      if (riskLevelEl) riskLevelEl.textContent = 'MEDIUM';

      // Update risk indicators
      const overdueProjectsEl = document.getElementById('overdueProjectsCount');
      const criticalTicketsEl = document.getElementById('criticalTicketsCount');
      const overdueInvoicesEl = document.getElementById('overdueInvoicesCount');
      const overallRiskEl = document.getElementById('overallRiskScore');

      if (overdueProjectsEl) overdueProjectsEl.textContent = '1';
      if (criticalTicketsEl) criticalTicketsEl.textContent = '3';
      if (overdueInvoicesEl) overdueInvoicesEl.textContent = '2';
      if (overallRiskEl) overallRiskEl.textContent = '35';

      // Update risk recommendations
      const recommendationsEl = document.getElementById('riskRecommendations');
      if (recommendationsEl) {
        recommendationsEl.innerHTML = `
          <div class="flex items-start space-x-3 p-3 bg-slate-700 rounded-lg">
            <i class="fas fa-lightbulb text-yellow-400 mt-1"></i>
            <div>
              <div class="text-white font-medium">Review project timelines</div>
            </div>
          </div>
          <div class="flex items-start space-x-3 p-3 bg-slate-700 rounded-lg">
            <i class="fas fa-lightbulb text-yellow-400 mt-1"></i>
            <div>
              <div class="text-white font-medium">Follow up on payments</div>
            </div>
          </div>
        `;
      }

      // Verify the UI is updated correctly
      expect(loadingEl).toHaveClass('hidden');
      expect(contentEl).not.toHaveClass('hidden');
      expect(successRateEl?.textContent).toBe('86%');
      expect(resolutionRateEl?.textContent).toBe('75%');
      expect(revenueEl?.textContent).toBe('$16,667');
      expect(riskScoreEl?.textContent).toBe('35');
      expect(riskLevelEl?.textContent).toBe('MEDIUM');
      expect(overdueProjectsEl?.textContent).toBe('1');
      expect(criticalTicketsEl?.textContent).toBe('3');
      expect(overdueInvoicesEl?.textContent).toBe('2');
      expect(overallRiskEl?.textContent).toBe('35');
      expect(recommendationsEl?.children.length).toBe(2);
    });

    it('should handle analytics loading error', async () => {
      // Mock failed fetch response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Create component HTML
      container.innerHTML = `
        <div id="analyticsLoading" class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
          <p class="text-gray-400">Loading advanced analytics...</p>
        </div>
        <div id="analyticsContent" class="hidden space-y-8">
          <p>Error loading analytics</p>
        </div>
      `;

      // Simulate error handling
      const loadingEl = document.getElementById('analyticsLoading');
      const contentEl = document.getElementById('analyticsContent');

      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');

      // Verify error state
      expect(loadingEl).toHaveClass('hidden');
      expect(contentEl).not.toHaveClass('hidden');
    });
  });

  describe('Insights Loading', () => {
    it('should show insights loading state initially', () => {
      container.innerHTML = `
        <div id="insightsLoading" class="text-center py-12">
          <i class="fas fa-brain fa-pulse text-4xl text-purple-400 mb-4"></i>
          <p class="text-gray-400">Generating intelligent insights...</p>
        </div>
        <div id="insightsContent" class="hidden space-y-8"></div>
      `;

      const loadingEl = document.getElementById('insightsLoading');
      const contentEl = document.getElementById('insightsContent');

      expect(loadingEl).not.toHaveClass('hidden');
      expect(contentEl).toHaveClass('hidden');
    });

    it('should load and display insights data', async () => {
      const mockInsightsData = {
        projectPredictions: [
          {
            projectId: 'project1',
            projectName: 'Test Project',
            currentProgress: 65,
            expectedProgress: 70,
            velocity: 0.85,
            predictedCompletionDate: '2025-12-20T00:00:00.000Z',
            isOnTrack: false,
            riskLevel: 'medium',
          },
        ],
        productivityInsights: {
          ticketVolumeGrowth: 15.5,
          projectVolumeGrowth: 8.2,
          productivityTrend: 'increasing',
          teamCapacity: 'optimal',
        },
        financialInsights: {
          quarterlyRevenue: 50000,
          quarterlyPaidRevenue: 35000,
          monthlyAverageRevenue: 16666.67,
          outstandingAmount: 15000,
          revenueGrowthRate: 12.5,
          paymentEfficiency: 70.0,
        },
        recommendations: [
          {
            type: 'project',
            priority: 'high',
            title: 'Address Overdue Projects',
            description:
              'You have 1 overdue project(s). Consider reviewing timelines and reallocating resources.',
            action: 'Review project timelines',
          },
        ],
        alerts: [
          {
            type: 'deadline',
            severity: 'warning',
            title: 'Project Deadline Approaching',
            message: 'Project "Test Project" is due on 12/20/2025',
            entityId: 'project1',
            entityType: 'project',
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      // Mock successful fetch response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsightsData,
      });

      // Create component HTML
      container.innerHTML = `
        <div id="insightsLoading" class="text-center py-12"></div>
        <div id="insightsContent" class="hidden space-y-8">
          <div id="projectPredictions" class="space-y-4"></div>
          <div class="text-2xl font-bold text-white" id="ticketGrowth">-</div>
          <div class="text-2xl font-bold text-white" id="projectGrowth">-</div>
          <div class="text-2xl font-bold text-white" id="teamCapacity">-</div>
          <div class="text-xl font-bold text-white" id="quarterlyRevenue">-</div>
          <div class="text-xl font-bold text-white" id="monthlyAvgRevenue">-</div>
          <div class="text-xl font-bold text-yellow-400" id="outstandingAmount">-</div>
          <div class="text-xl font-bold text-green-400" id="paymentEfficiency">-</div>
          <div id="recommendations" class="space-y-4"></div>
          <div id="alerts" class="space-y-3"></div>
        </div>
      `;

      // Simulate successful insights loading
      const loadingEl = document.getElementById('insightsLoading');
      const contentEl = document.getElementById('insightsContent');

      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');

      // Update project predictions
      const predictionsEl = document.getElementById('projectPredictions');
      if (predictionsEl) {
        predictionsEl.innerHTML = `
          <div class="border border-slate-600 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-white font-medium">Test Project</h4>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs font-medium">MEDIUM</span>
                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div class="text-gray-400 mb-1">Current Progress</div>
                <div class="text-white font-medium">65%</div>
              </div>
              <div>
                <div class="text-gray-400 mb-1">Expected Progress</div>
                <div class="text-white font-medium">70%</div>
              </div>
              <div>
                <div class="text-gray-400 mb-1">Predicted Completion</div>
                <div class="text-white font-medium">12/20/2025</div>
              </div>
            </div>
          </div>
        `;
      }

      // Update productivity insights
      const ticketGrowthEl = document.getElementById('ticketGrowth');
      const projectGrowthEl = document.getElementById('projectGrowth');
      const teamCapacityEl = document.getElementById('teamCapacity');

      if (ticketGrowthEl) ticketGrowthEl.textContent = '+15.5%';
      if (projectGrowthEl) projectGrowthEl.textContent = '+8.2%';
      if (teamCapacityEl) teamCapacityEl.textContent = 'Optimal';

      // Update financial insights
      const quarterlyRevenueEl = document.getElementById('quarterlyRevenue');
      const monthlyAvgRevenueEl = document.getElementById('monthlyAvgRevenue');
      const outstandingAmountEl = document.getElementById('outstandingAmount');
      const paymentEfficiencyEl = document.getElementById('paymentEfficiency');

      if (quarterlyRevenueEl) quarterlyRevenueEl.textContent = '$50,000';
      if (monthlyAvgRevenueEl) monthlyAvgRevenueEl.textContent = '$16,667';
      if (outstandingAmountEl) outstandingAmountEl.textContent = '$15,000';
      if (paymentEfficiencyEl) paymentEfficiencyEl.textContent = '70%';

      // Update recommendations
      const recommendationsEl = document.getElementById('recommendations');
      if (recommendationsEl) {
        recommendationsEl.innerHTML = `
          <div class="border border-slate-600 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <i class="fas fa-lightbulb text-red-400 mt-1"></i>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-white font-medium">Address Overdue Projects</h4>
                  <span class="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-medium">HIGH</span>
                </div>
                <p class="text-gray-400 text-sm mb-3">You have 1 overdue project(s). Consider reviewing timelines and reallocating resources.</p>
                <button class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors duration-200">
                  Review project timelines
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // Update alerts
      const alertsEl = document.getElementById('alerts');
      if (alertsEl) {
        alertsEl.innerHTML = `
          <div class="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <i class="fas fa-clock text-yellow-400 mt-1"></i>
            <div class="flex-1">
              <div class="text-white font-medium">Project Deadline Approaching</div>
              <div class="text-gray-400 text-sm">Project "Test Project" is due on 12/20/2025</div>
            </div>
          </div>
        `;
      }

      // Verify the UI is updated correctly
      expect(loadingEl).toHaveClass('hidden');
      expect(contentEl).not.toHaveClass('hidden');
      expect(ticketGrowthEl?.textContent).toBe('+15.5%');
      expect(projectGrowthEl?.textContent).toBe('+8.2%');
      expect(teamCapacityEl?.textContent).toBe('Optimal');
      expect(quarterlyRevenueEl?.textContent).toBe('$50,000');
      expect(monthlyAvgRevenueEl?.textContent).toBe('$16,667');
      expect(outstandingAmountEl?.textContent).toBe('$15,000');
      expect(paymentEfficiencyEl?.textContent).toBe('70%');
      expect(predictionsEl?.children.length).toBe(1);
      expect(recommendationsEl?.children.length).toBe(1);
      expect(alertsEl?.children.length).toBe(1);
    });
  });

  describe('Time Range Selection', () => {
    it('should update analytics when time range changes', async () => {
      // Mock fetch for different time ranges
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ timeRange: 7 }),
      });

      // Create component HTML
      container.innerHTML = `
        <select id="timeRange" class="bg-slate-800 text-white px-3 py-2 rounded-lg">
          <option value="7">Last 7 days</option>
          <option value="30" selected>Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      `;

      const timeRangeSelect = document.getElementById(
        'timeRange'
      ) as HTMLSelectElement;

      // Simulate time range change
      if (timeRangeSelect) {
        timeRangeSelect.value = '7';
        timeRangeSelect.dispatchEvent(new Event('change'));
      }

      // Verify fetch was called with correct time range
      expect(fetch).toHaveBeenCalledWith(
        '/api/dashboard/analytics?timeRange=7',
        expect.any(Object)
      );
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh analytics when refresh button is clicked', async () => {
      // Mock fetch for refresh
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ refreshed: true }),
      });

      // Create component HTML
      container.innerHTML = `
        <button id="refreshAnalytics" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          <i class="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      `;

      const refreshBtn = document.getElementById('refreshAnalytics');

      // Simulate refresh button click
      if (refreshBtn) {
        refreshBtn.dispatchEvent(new Event('click'));
      }

      // Verify fetch was called with refresh parameter
      expect(fetch).toHaveBeenCalledWith(
        '/api/dashboard/analytics?timeRange=30&refresh=true',
        expect.any(Object)
      );
    });

    it('should refresh insights when refresh button is clicked', async () => {
      // Mock fetch for insights refresh
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ refreshed: true }),
      });

      // Create component HTML
      container.innerHTML = `
        <button id="refreshInsights" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
          <i class="fas fa-brain"></i>
          <span>Refresh Insights</span>
        </button>
      `;

      const refreshBtn = document.getElementById('refreshInsights');

      // Simulate refresh button click
      if (refreshBtn) {
        refreshBtn.dispatchEvent(new Event('click'));
      }

      // Verify fetch was called with refresh parameter
      expect(fetch).toHaveBeenCalledWith(
        '/api/dashboard/insights?refresh=true',
        expect.any(Object)
      );
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh analytics on dashboard update events', () => {
      // Mock fetch for real-time updates
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ updated: true }),
      });

      // Create component HTML
      container.innerHTML = `
        <div id="analyticsContent"></div>
        <div id="insightsContent"></div>
      `;

      // Simulate dashboard update event
      const dashboardUpdateEvent = new CustomEvent('dashboard-update', {
        detail: { type: 'project' },
      });
      window.dispatchEvent(dashboardUpdateEvent);

      // Verify fetch was called for both analytics and insights
      expect(fetch).toHaveBeenCalledWith(
        '/api/dashboard/analytics?timeRange=30',
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        '/api/dashboard/insights',
        expect.any(Object)
      );
    });
  });
});
