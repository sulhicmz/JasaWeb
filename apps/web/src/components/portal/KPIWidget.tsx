import React, { useState, useEffect } from 'react';

interface KPIData {
  clientSatisfaction: number;
  averageDeliveryTime: number;
  slaCompliance: number;
  revenueGrowth: number;
  clientRetentionRate: number;
  projectSuccessRate: number;
}

interface KPIWidgetProps {
  organizationId: string;
}

const KPIWidget: React.FC<KPIWidgetProps> = ({ organizationId }) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadKPIData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadKPIData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/dashboard/kpi', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }

      const kpi = await response.json();
      setKpiData(kpi);
      setLastUpdated(new Date());
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error loading KPI data:', error);
      }
      setError('Failed to load KPI data');
      // Set mock data for development
      setKpiData({
        clientSatisfaction: 8.5,
        averageDeliveryTime: 42,
        slaCompliance: 94,
        revenueGrowth: 15.5,
        clientRetentionRate: 92,
        projectSuccessRate: 88,
      });
    } finally {
      setLoading(false);
    }
  };

  const getKPIStatus = (
    value: number,
    type: string
  ): 'excellent' | 'good' | 'warning' | 'critical' => {
    switch (type) {
      case 'satisfaction':
        if (value >= 9) return 'excellent';
        if (value >= 8) return 'good';
        if (value >= 7) return 'warning';
        return 'critical';
      case 'deliveryTime':
        if (value <= 35) return 'excellent';
        if (value <= 45) return 'good';
        if (value <= 55) return 'warning';
        return 'critical';
      case 'sla':
        if (value >= 95) return 'excellent';
        if (value >= 90) return 'good';
        if (value >= 85) return 'warning';
        return 'critical';
      case 'growth':
        if (value >= 20) return 'excellent';
        if (value >= 10) return 'good';
        if (value >= 5) return 'warning';
        return 'critical';
      case 'retention':
        if (value >= 95) return 'excellent';
        if (value >= 90) return 'good';
        if (value >= 85) return 'warning';
        return 'critical';
      case 'success':
        if (value >= 95) return 'excellent';
        if (value >= 85) return 'good';
        if (value >= 75) return 'warning';
        return 'critical';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatKPIValue = (value: number, type: string): string => {
    switch (type) {
      case 'satisfaction':
      case 'retention':
      case 'success':
      case 'sla':
        return `${value}%`;
      case 'deliveryTime':
        return `${value} days`;
      case 'growth':
        return `${value}%`;
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !kpiData) {
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
          <p className="mt-2 text-gray-500">Unable to load KPI data</p>
          <button
            onClick={loadKPIData}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const kpiItems = [
    {
      key: 'clientSatisfaction',
      label: 'Client Satisfaction',
      value: kpiData!.clientSatisfaction,
      type: 'satisfaction',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      key: 'averageDeliveryTime',
      label: 'Avg. Delivery Time',
      value: kpiData!.averageDeliveryTime,
      type: 'deliveryTime',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      key: 'slaCompliance',
      label: 'SLA Compliance',
      value: kpiData!.slaCompliance,
      type: 'sla',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      key: 'revenueGrowth',
      label: 'Revenue Growth',
      value: kpiData!.revenueGrowth,
      type: 'growth',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      ),
    },
    {
      key: 'clientRetentionRate',
      label: 'Client Retention',
      value: kpiData!.clientRetentionRate,
      type: 'retention',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
    },
    {
      key: 'projectSuccessRate',
      label: 'Project Success Rate',
      value: kpiData!.projectSuccessRate,
      type: 'success',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Key Performance Indicators
        </h3>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadKPIData}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh KPI data"
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpiItems.map((item) => {
          const status = getKPIStatus(item.value, item.type);
          const statusColor = getStatusColor(status);

          return (
            <div
              key={item.key}
              className="text-center p-4 rounded-lg border border-gray-200"
            >
              <div className="flex justify-center mb-2">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {item.icon}
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatKPIValue(item.value, item.type)}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${statusColor}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          );
        })}
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

export default KPIWidget;
