import React, { useState, useEffect } from 'react';
import DynamicChart from './DynamicChart';
import {
  analyticsService,
  AnalyticsFilters,
  TeamPerformanceAnalytics,
} from '../../services/analyticsService';

interface TeamPerformanceProps {
  className?: string;
}

const TeamPerformance: React.FC<TeamPerformanceProps> = ({
  className = '',
}) => {
  const [teamData, setTeamData] = useState<TeamPerformanceAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadTeamPerformance();
  }, [filters]);

  const loadTeamPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getTeamPerformanceAnalytics(filters);
      setTeamData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load team performance data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <p className="text-lg font-semibold">
            Error loading team performance
          </p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadTeamPerformance}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const taskCompletionData = {
    labels: teamData.map((member) => member.name || member.email),
    datasets: [
      {
        label: 'Task Completion Rate (%)',
        data: teamData.map((member) => member.tasks.completionRate),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const approvalCompletionData = {
    labels: teamData.map((member) => member.name || member.email),
    datasets: [
      {
        label: 'Approval Completion Rate (%)',
        data: teamData.map((member) => member.approvals.completionRate),
        backgroundColor: '#10b981',
      },
    ],
  };

  const ticketResolutionData = {
    labels: teamData.map((member) => member.name || member.email),
    datasets: [
      {
        label: 'Ticket Resolution Rate (%)',
        data: teamData.map((member) => member.tickets.resolutionRate),
        backgroundColor: '#f59e0b',
      },
    ],
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Team Performance
            </h2>
            <p className="text-gray-600">
              Individual team member productivity and metrics
            </p>
          </div>
        </div>

        {/* Filters */}
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
              Team Member
            </label>
            <select
              value={filters.userId || ''}
              onChange={(e) =>
                handleFilterChange({ userId: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Members</option>
              {teamData.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Task Completion Rates
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={taskCompletionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Approval Completion Rates
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={approvalCompletionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ticket Resolution Rates
          </h3>
          <div className="h-64">
            <DynamicChart
              type="bar"
              data={ticketResolutionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Team Member Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approvals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamData.map((member) => (
                <tr key={member.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.tasks.completed}/{member.tasks.total}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.tasks.completionRate.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.approvals.completed}/{member.approvals.total}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.approvals.completionRate.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.tickets.resolved}/{member.tickets.total}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.tickets.resolutionRate.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;
