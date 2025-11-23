import React, { useState, useEffect } from 'react';
import DynamicChart from './DynamicChart';
import {
  analyticsService,
  AnalyticsFilters,
  OverviewAnalytics,
} from '../../services/analyticsService';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = '',
}) => {
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getOverviewAnalytics(filters);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (type: 'pdf' | 'excel' | 'csv') => {
    try {
      await analyticsService.exportData(type, analytics);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.debug('Export failed:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error loading analytics</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare chart data
  const projectStatusData = {
    labels: ['Completed', 'In Progress', 'Overdue'],
    datasets: [
      {
        label: 'Projects',
        data: [
          analytics.projects.summary.completedProjects,
          analytics.projects.summary.inProgressProjects,
          analytics.projects.summary.overdueProjects,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
      },
    ],
  };

  const completionRatesData = {
    labels: ['Projects', 'Milestones', 'Tasks'],
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: [
          analytics.projects.summary.completionRate,
          analytics.projects.milestones.completionRate,
          analytics.projects.tasks.completionRate,
        ],
        backgroundColor: ['#8b5cf6', '#06b6d4', '#f59e0b'],
      },
    ],
  };

  const financialData = {
    labels: Object.keys(analytics.financial.byCurrency),
    datasets: [
      {
        label: 'Total Amount',
        data: Object.values(analytics.financial.byCurrency).map(
          (item) => item.amount
        ),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Paid Amount',
        data: Object.values(analytics.financial.byCurrency).map(
          (item) => item.paid
        ),
        backgroundColor: '#10b981',
      },
    ],
  };

  const ticketPriorityData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Total Tickets',
        data: [
          analytics.clientInsights.byPriority.critical.total,
          analytics.clientInsights.byPriority.high.total,
          analytics.clientInsights.byPriority.medium.total,
          analytics.clientInsights.byPriority.low.total,
        ],
        backgroundColor: '#ef4444',
      },
      {
        label: 'Resolved Tickets',
        data: [
          analytics.clientInsights.byPriority.critical.resolved,
          analytics.clientInsights.byPriority.high.resolved,
          analytics.clientInsights.byPriority.medium.resolved,
          analytics.clientInsights.byPriority.low.resolved,
        ],
        backgroundColor: '#10b981',
      },
    ],
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Filters and Export */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600">
              Comprehensive insights into your projects and performance
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Granularity
            </label>
            <select
              value={filters.granularity || 'day'}
              onChange={(e) =>
                handleFilterChange({
                  granularity: e.target.value as 'day' | 'week' | 'month',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">P</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.projects.summary.totalProjects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.projects.summary.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analytics.financial.summary.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.clientInsights.summary.totalTickets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Status
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={projectStatusData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Completion Rates Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completion Rates
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={completionRatesData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Financial Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Financial Overview
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={financialData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Ticket Priority Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tickets by Priority
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={ticketPriorityData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
