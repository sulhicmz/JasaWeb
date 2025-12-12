import React, { useState, useEffect } from 'react';

interface TrendData {
  period: string;
  value: number;
  change?: number;
}

interface AnalyticsData {
  projectTrends: TrendData[];
  ticketTrends: TrendData[];
  revenueTrends: TrendData[];
  clientSatisfactionTrends: TrendData[];
}

interface AdvancedAnalyticsProps {
  organizationId: string;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  organizationId,
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('month');
  const [selectedMetric, setSelectedMetric] = useState<string>('projects');

  useEffect(() => {
    loadAnalyticsData();
  }, [organizationId, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');

      // Mock API call - in real implementation, this would call analytics endpoints
      // const response = await fetch(`http://localhost:3001/dashboard/analytics?timeRange=${timeRange}`, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // Mock data for demonstration
      const mockData: AnalyticsData = {
        projectTrends: generateMockTrendData('projects', timeRange),
        ticketTrends: generateMockTrendData('tickets', timeRange),
        revenueTrends: generateMockTrendData('revenue', timeRange),
        clientSatisfactionTrends: generateMockTrendData(
          'satisfaction',
          timeRange
        ),
      };

      setAnalyticsData(mockData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error loading analytics data:', error);
      }
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockTrendData = (type: string, range: string): TrendData[] => {
    const periods = getPeriods(range);
    const baseValue = getBaseValue(type);

    return periods.map((period, index) => {
      const randomVariation = Math.random() * 0.3 - 0.15; // ±15% variation
      const trendFactor = 1 + index * 0.05; // 5% growth per period
      const value = Math.round(baseValue * trendFactor * (1 + randomVariation));
      const previousValue =
        index > 0 ? baseValue * (1 + (index - 1) * 0.05) : baseValue;
      const change =
        index > 0
          ? Math.round(((value - previousValue) / previousValue) * 100)
          : 0;

      return { period, value, change };
    });
  };

  const getPeriods = (range: string): string[] => {
    switch (range) {
      case 'week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'month':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'quarter':
        return ['Month 1', 'Month 2', 'Month 3'];
      case 'year':
        return [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
      default:
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    }
  };

  const getBaseValue = (type: string): number => {
    switch (type) {
      case 'projects':
        return 15;
      case 'tickets':
        return 25;
      case 'revenue':
        return 50000;
      case 'satisfaction':
        return 8.5;
      default:
        return 10;
    }
  };

  const getCurrentTrendData = (): TrendData[] => {
    if (!analyticsData) return [];

    switch (selectedMetric) {
      case 'projects':
        return analyticsData.projectTrends;
      case 'tickets':
        return analyticsData.ticketTrends;
      case 'revenue':
        return analyticsData.revenueTrends;
      case 'satisfaction':
        return analyticsData.clientSatisfactionTrends;
      default:
        return analyticsData.projectTrends;
    }
  };

  const formatValue = (value: number, metric: string): string => {
    switch (metric) {
      case 'revenue':
        return `$${(value / 1000).toFixed(0)}K`;
      case 'satisfaction':
        return value.toFixed(1);
      default:
        return value.toString();
    }
  };

  const getTrendColor = (change: number): string => {
    if (change > 5) return 'text-green-600';
    if (change > 0) return 'text-green-500';
    if (change > -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderSparkline = (data: TrendData[]) => {
    if (data.length < 2) return null;

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const points = data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-16">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-indigo-600"
        />
        <circle
          cx={((data.length - 1) / (data.length - 1)) * 100}
          cy={100 - ((data[data.length - 1].value - minValue) / range) * 100}
          r="3"
          className="fill-current text-indigo-600"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
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
          <p className="mt-2 text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  const metrics = [
    { key: 'projects', label: 'Projects', icon: '📊' },
    { key: 'tickets', label: 'Support Tickets', icon: '🎫' },
    { key: 'revenue', label: 'Revenue', icon: '💰' },
    { key: 'satisfaction', label: 'Client Satisfaction', icon: '😊' },
  ];

  const currentData = getCurrentTrendData();
  const latestValue = currentData[currentData.length - 1];
  const previousValue =
    currentData.length > 1 ? currentData[currentData.length - 2] : null;
  const totalChange = previousValue
    ? Math.round(
        ((latestValue.value - previousValue.value) / previousValue.value) * 100
      )
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Advanced Analytics
        </h3>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh analytics"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => {
          const data = analyticsData[
            `${metric.key}Trends` as keyof AnalyticsData
          ] as TrendData[];
          const latest = data[data.length - 1];
          const previous = data.length > 1 ? data[data.length - 2] : null;
          const change = previous
            ? Math.round(
                ((latest.value - previous.value) / previous.value) * 100
              )
            : 0;

          return (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMetric === metric.key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{metric.icon}</div>
              <div className="text-sm font-medium text-gray-900">
                {metric.label}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatValue(latest.value, metric.key)}
              </div>
              <div className={`text-xs ${getTrendColor(change)}`}>
                {change > 0 ? '+' : ''}
                {change}%
              </div>
              <div className="mt-2">{renderSparkline(data)}</div>
            </button>
          );
        })}
      </div>

      {/* Detailed Chart */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">
            {metrics.find((m) => m.key === selectedMetric)?.label} Trend
            Analysis
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Current:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatValue(latestValue.value, selectedMetric)}
            </span>
            <span
              className={`text-sm font-medium ${getTrendColor(totalChange)}`}
            >
              {totalChange > 0 ? '+' : ''}
              {totalChange}%
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3">
          {currentData.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-gray-600 text-right">
                {item.period}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="h-6 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                      style={{
                        width: `${(item.value / Math.max(...currentData.map((d) => d.value))) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-20 text-sm font-medium text-gray-900 text-right">
                    {formatValue(item.value, selectedMetric)}
                  </div>
                  {item.change !== undefined && (
                    <div
                      className={`w-12 text-xs text-right ${getTrendColor(item.change)}`}
                    >
                      {item.change > 0 ? '+' : ''}
                      {item.change}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-blue-900">Insight</h5>
              <p className="text-sm text-blue-700 mt-1">
                {selectedMetric === 'revenue' && totalChange > 0
                  ? `Revenue is trending upward with ${totalChange}% growth. Consider expanding services to maintain momentum.`
                  : selectedMetric === 'tickets' && totalChange < 0
                    ? `Support tickets are decreasing by ${Math.abs(totalChange)}%. Customer satisfaction may be improving.`
                    : selectedMetric === 'projects' && totalChange > 0
                      ? `Project volume increased by ${totalChange}%. Ensure resource allocation matches demand.`
                      : selectedMetric === 'satisfaction' && totalChange >= 0
                        ? `Client satisfaction is stable at ${latestValue.value.toFixed(1)}/10. Continue current service quality.`
                        : `Monitor this metric closely for the next period to identify trends.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="ml-2 text-sm text-yellow-700">
              Using cached data. {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
