/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

interface DashboardChartsProps {
  organizationId: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  organizationId,
}) => {
  const [projectStatusData, setProjectStatusData] = useState<ChartData | null>(
    null
  );
  const [ticketPriorityData, setTicketPriorityData] =
    useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [organizationId]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/dashboard/stats');

      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }

      const stats = response.data as any;

      // Transform data for charts
      const projectChartData: ChartData = {
        labels: ['Active', 'Completed', 'On Hold'],
        datasets: [
          {
            label: 'Projects',
            data: [
              stats.projects.active,
              stats.projects.completed,
              stats.projects.onHold,
            ],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
            borderColor: ['#2563EB', '#059669', '#D97706'],
          },
        ],
      };

      const ticketChartData: ChartData = {
        labels: ['Open', 'In Progress', 'High Priority', 'Critical'],
        datasets: [
          {
            label: 'Tickets',
            data: [
              stats.tickets.open,
              stats.tickets.inProgress,
              stats.tickets.highPriority,
              stats.tickets.critical,
            ],
            backgroundColor: ['#6B7280', '#F59E0B', '#EF4444', '#991B1B'],
            borderColor: ['#4B5563', '#D97706', '#DC2626', '#7F1D1D'],
          },
        ],
      };

      setProjectStatusData(projectChartData);
      setTicketPriorityData(ticketChartData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading chart data:', error);
      }
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (data: ChartData, title: string) => {
    if (
      !data ||
      !data.datasets[0] ||
      data.datasets[0].data.every((value) => value === 0)
    ) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="mt-2 text-gray-500">No data available</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...(data.datasets[0]?.data || []));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          {(data.labels || []).map((label, index) => {
            const value = (data.datasets[0]?.data || [])[index] || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const backgroundColor =
              (data.datasets[0]?.backgroundColor || [])[index] || '#6B7280';

            return (
              <div key={label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPieChart = (data: ChartData, title: string) => {
    const total = (data.datasets[0]?.data || []).reduce(
      (sum, value) => sum + (value || 0),
      0
    );

    if (total === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p className="mt-2 text-gray-500">No data available</p>
          </div>
        </div>
      );
    }

    // Calculate angles for pie slices
    let currentAngle = 0;
    const slices = (data.labels || []).map((label, index) => {
      const value = (data.datasets[0]?.data || [])[index] || 0;
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        label,
        value,
        percentage,
        startAngle,
        endAngle,
        color: (data.datasets[0]?.backgroundColor || [])[index] || '#6B7280',
      };
    });

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 42 42" className="w-32 h-32">
              {slices.map((slice, index) => {
                const startAngleRad = (slice.startAngle * Math.PI) / 180;
                const endAngleRad = (slice.endAngle * Math.PI) / 180;
                const x1 = 21 + 15 * Math.cos(startAngleRad);
                const y1 = 21 + 15 * Math.sin(startAngleRad);
                const x2 = 21 + 15 * Math.cos(endAngleRad);
                const y2 = 21 + 15 * Math.sin(endAngleRad);
                const largeArcFlag =
                  slice.endAngle - slice.startAngle > 180 ? 1 : 0;

                return (
                  <path
                    key={index}
                    d={`M 21 21 L ${x1} ${y1} A 15 15 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={slice.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          {slices.map((slice, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                ></div>
                <span className="text-gray-600">{slice.label}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900">{slice.value}</span>
                <span className="text-gray-500 ml-1">
                  ({slice.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-2 bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-gray-500">Failed to load charts</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {projectStatusData &&
        renderBarChart(projectStatusData, 'Project Status Distribution')}
      {ticketPriorityData &&
        renderPieChart(ticketPriorityData, 'Ticket Priority Breakdown')}
    </div>
  );
};

export default DashboardCharts;
