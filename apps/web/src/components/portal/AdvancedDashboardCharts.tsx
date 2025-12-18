import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
    tension?: number;
  }[];
}

interface AdvancedDashboardChartsProps {
  organizationId: string;
}

interface TrendData {
  trend: number;
  change: number;
  changePercent: number;
  daily?: number[];
  weekly?: number[];
  monthly?: number[];
}

interface AnalyticsTrends {
  period: string;
  startDate: string;
  endDate: string;
  trends: {
    projects: TrendData;
    tickets: TrendData;
    milestones: TrendData;
    invoices: TrendData;
  };
}

interface PerformanceMetric {
  efficiency: number;
  quality: number;
  timeliness: number;
  cost: number;
  onTimeCompletionRate?: number;
  slaComplianceRate?: number;
  overdueRate?: number;
  totalProjects?: number;
  completedProjects?: number;
  averageResolutionTime?: number;
  resolvedTickets?: number;
  totalInvoices?: number;
}

interface PerformanceMetrics {
  period: string;
  projectPerformance: PerformanceMetric;
  ticketResolution: PerformanceMetric;
  milestoneCompletion: PerformanceMetric;
  invoiceMetrics: PerformanceMetric;
}

interface Prediction {
  value: number;
  confidence: number;
  timeframe: string;
  predictedCompletions?: number;
  highRiskProjects?: number;
  currentMonthlyAverage?: number;
  predictedRevenue?: number;
  revenueGrowthRate?: number;
  riskLevel?: string;
  overallRiskScore?: number;
}

interface PredictiveData {
  horizon: string;
  confidenceLevel: number;
  predictions: {
    projects: Prediction;
    revenue: Prediction;
    risks: Prediction;
    capacity: Prediction;
  };
  recommendations: string[];
}

const AdvancedDashboardCharts: React.FC<AdvancedDashboardChartsProps> = ({
  organizationId,
}) => {
  const [analyticsTrends, setAnalyticsTrends] =
    useState<AnalyticsTrends | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(
    null
  );
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'trends' | 'performance' | 'predictive'
  >('trends');

  useEffect(() => {
    loadAnalyticsData();
  }, [organizationId, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trendsResponse, performanceResponse, predictiveResponse] =
        await Promise.all([
          apiClient.get(`/dashboard/analytics/trends?period=${selectedPeriod}`),
          apiClient.get('/dashboard/analytics/performance'),
          apiClient.get('/dashboard/analytics/predictive'),
        ]);

      if (trendsResponse.data && !trendsResponse.error) {
        setAnalyticsTrends(trendsResponse.data as AnalyticsTrends);
      }
      if (performanceResponse.data && !performanceResponse.error) {
        setPerformanceMetrics(performanceResponse.data as PerformanceMetrics);
      }
      if (predictiveResponse.data && !predictiveResponse.error) {
        setPredictiveData(predictiveResponse.data as PredictiveData);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading analytics data:', error);
      }
      setError('Failed to load advanced analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderLineChart = (data: ChartData, title: string) => {
    if (
      !data ||
      !data.datasets[0] ||
      data.datasets[0].data.every((value) => value === 0)
    ) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
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
    const months = [
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
    const labels = (data.labels || []).map((label) => {
      const date = new Date(label);
      return months[date.getMonth()];
    });

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="relative h-64 mb-4">
          {/* Simple SVG line chart visualization */}
          <svg viewBox="0 0 400 150" className="w-full h-full">
            {(data.datasets[0]?.data || []).map((value, index) => {
              const dataLength = (data.datasets[0]?.data || []).length;
              const x = (index / (dataLength - 1)) * 380 + 10;
              const y = maxValue > 0 ? 140 - (value / maxValue) * 120 : 70;

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3B82F6"
                  className="cursor-pointer hover:r-4"
                />
              );
            })}
            {/* Draw line connecting points */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={(data.datasets[0]?.data || [])
                .map((value, index) => {
                  const dataLength = (data.datasets[0]?.data || []).length;
                  const x = (index / (dataLength - 1)) * 380 + 10;
                  const y = maxValue > 0 ? 140 - (value / maxValue) * 120 : 70;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
        </div>
        <div className="text-sm text-gray-600 text-center">
          {labels[0]} - {labels[labels.length - 1]}
        </div>
      </div>
    );
  };

  const renderGaugeChart = (value: number, label: string, max = 100) => {
    const percentage = Math.min((value / max) * 100, 100);

    let color = '#10B981'; // Green
    if (percentage > 80)
      color = '#EF4444'; // Red
    else if (percentage > 60) color = '#F59E0B'; // Yellow

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>
        <div className="relative">
          <svg viewBox="0 0 200 120" className="w-full h-32">
            {/* Background arc */}
            <path
              d="M 20 100 A 60 60 0 0 1 180 100"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 20 100 A 60 60 0 0 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 1.88} 188`}
              transform="rotate(-90 100 100)"
            />
            {/* Center text */}
            <text
              x="100"
              y="90"
              textAnchor="middle"
              className="text-2xl font-bold fill-gray-800"
            >
              {value}%
            </text>
          </svg>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">Performance</span>
          </div>
        </div>
      </div>
    );
  };

  const renderProgressBar = (
    value: number,
    max: number,
    label: string,
    color: string
  ) => {
    const percentage = (value / max) * 100;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <span className="text-sm font-medium text-gray-600">
            {value}/{max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          ></div>
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const renderPredictiveInsights = () => {
    if (!predictiveData) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Completion Predictions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {predictiveData.predictions.projects.predictedCompletions || 0}
              </div>
              <div className="text-sm text-blue-800">Predicted Completions</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {predictiveData.predictions.projects.highRiskProjects || 0}
              </div>
              <div className="text-sm text-red-800">High Risk Projects</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Forecast
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Monthly Average</span>
              <span className="font-semibold">
                $
                {(
                  predictiveData.predictions.revenue?.currentMonthlyAverage || 0
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Predicted Revenue</span>
              <span className="font-semibold text-green-600">
                $
                {(
                  predictiveData.predictions.revenue?.predictedRevenue || 0
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth Rate</span>
              <span className="font-semibold text-blue-600">
                +{predictiveData.predictions.revenue?.revenueGrowthRate || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Risk Assessment
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overall Risk Level</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  (predictiveData.predictions.risks?.riskLevel || 'low') ===
                  'high'
                    ? 'bg-red-100 text-red-800'
                    : (predictiveData.predictions.risks?.riskLevel || 'low') ===
                        'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {predictiveData.predictions.risks?.riskLevel || 'Low'} Risk
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Risk Score</span>
              <span className="font-semibold">
                {predictiveData.predictions.risks?.overallRiskScore || 0}%
              </span>
            </div>
          </div>
        </div>

        {predictiveData.recommendations &&
          predictiveData.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Recommendations
              </h3>
              <div className="space-y-2">
                {predictiveData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <svg
                      className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-3 bg-gray-200 rounded w-20"></div>
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
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
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
        <p className="mt-2 text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['7d', '30d', '90d'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {period === '7d'
              ? '7 Days'
              : period === '30d'
                ? '30 Days'
                : '90 Days'}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'trends', label: 'Analytics Trends' },
            { key: 'performance', label: 'Performance' },
            { key: 'predictive', label: 'Predictive Insights' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(tab.key as 'trends' | 'performance' | 'predictive')
              }
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'trends' && analyticsTrends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(analyticsTrends.trends).map(([key, data]) => (
            <div key={key}>
              {renderLineChart(
                {
                  labels: data.daily?.map((d: any) => d.date) || [],
                  datasets: [
                    {
                      label: key.charAt(0).toUpperCase() + key.slice(1),
                      data: data.daily?.map((d: any) => d.count) || [],
                      backgroundColor: ['#3B82F6'],
                      borderColor: ['#2563EB'],
                      tension: 0.4,
                    },
                  ],
                },
                `${key.charAt(0).toUpperCase() + key.slice(1)} Trends`
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'performance' && performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderGaugeChart(
            performanceMetrics.projectPerformance?.onTimeCompletionRate || 0,
            'On-Time Completion'
          )}
          {renderGaugeChart(
            performanceMetrics.ticketResolution?.slaComplianceRate || 0,
            'SLA Compliance'
          )}
          {renderGaugeChart(
            performanceMetrics.milestoneCompletion?.overdueRate
              ? 100 - performanceMetrics.milestoneCompletion.overdueRate
              : 100,
            'Milestone Health'
          )}
          {renderProgressBar(
            performanceMetrics.projectPerformance?.totalProjects || 0,
            50,
            'Total Projects',
            '#3B82F6'
          )}
          {renderProgressBar(
            performanceMetrics.ticketResolution?.resolvedTickets || 0,
            100,
            'Resolved Tickets',
            '#10B981'
          )}
          {renderProgressBar(
            performanceMetrics.invoiceMetrics?.totalInvoices || 0,
            50,
            'Total Invoices',
            '#8B5CF6'
          )}
        </div>
      )}

      {activeTab === 'predictive' && <div>{renderPredictiveInsights()}</div>}
    </div>
  );
};

export default AdvancedDashboardCharts;
