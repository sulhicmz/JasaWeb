import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@jasaweb/ui';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface ProjectMetrics {
  projectId: string;
  organizationId: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  averageTaskDuration: number;
  budgetUtilization: number;
  timelineAdherence: number;
  teamProductivity: number;
  riskScore: number;
  clientSatisfactionPrediction: number;
}

interface OrganizationAnalytics {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    averageProjectDuration: number;
    clientSatisfactionScore: number;
  };
  trends: {
    projectCompletion: Array<{
      period: string;
      value: number;
      change: number;
      changePercent: number;
    }>;
    revenue: Array<{
      period: string;
      value: number;
      change: number;
      changePercent: number;
    }>;
    teamProductivity: Array<{
      period: string;
      value: number;
      change: number;
      changePercent: number;
    }>;
  };
  topPerformers: Array<{
    userId: string;
    name: string;
    completedTasks: number;
    productivityScore: number;
  }>;
  riskAnalysis: {
    highRiskProjects: number;
    budgetOverruns: number;
    timelineDelays: number;
  };
}

interface PredictiveMetrics {
  estimatedCompletion: Date;
  budgetOverrunRisk: number;
  timelineDelayRisk: number;
  qualityScore: number;
  recommendedActions: string[];
}

export const ProjectAnalyticsDashboard: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [predictions, setPredictions] = useState<PredictiveMetrics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsResponse, predictionsResponse] = await Promise.all([
        fetch(`/api/analytics/projects/${projectId}/metrics`),
        fetch(`/api/analytics/projects/${projectId}/predictions`),
      ]);

      if (!metricsResponse.ok || !predictionsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const metricsData = await metricsResponse.json();
      const predictionsData = await predictionsResponse.json();

      setMetrics(metricsData);
      setPredictions(predictionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !metrics || !predictions) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">
            Error: {error || 'Failed to load analytics data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const taskCompletionData = {
    labels: ['Completed', 'In Progress', 'Overdue'],
    datasets: [
      {
        data: [
          metrics.completedTasks,
          metrics.totalTasks - metrics.completedTasks - metrics.overdueTasks,
          metrics.overdueTasks,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const budgetData = {
    labels: ['Utilized', 'Remaining'],
    datasets: [
      {
        data: [
          metrics.budgetUtilization,
          Math.max(0, 100 - metrics.budgetUtilization),
        ],
        backgroundColor: [
          metrics.budgetUtilization > 100 ? '#ef4444' : '#10b981',
          '#e5e7eb',
        ],
        borderWidth: 0,
      },
    ],
  };

  const riskGaugeData = {
    labels: ['Risk Score'],
    datasets: [
      {
        data: [metrics.riskScore],
        backgroundColor:
          metrics.riskScore > 70
            ? '#ef4444'
            : metrics.riskScore > 40
              ? '#f59e0b'
              : '#10b981',
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalTasks > 0
                ? Math.round(
                    (metrics.completedTasks / metrics.totalTasks) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500">
              {metrics.completedTasks} of {metrics.totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.budgetUtilization > 100 ? 'text-red-600' : 'text-green-600'}`}
            >
              {Math.round(metrics.budgetUtilization)}%
            </div>
            <p className="text-xs text-gray-500">
              {metrics.budgetUtilization > 100 ? 'Over budget' : 'On track'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Timeline Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.timelineAdherence < 80 ? 'text-red-600' : 'text-green-600'}`}
            >
              {Math.round(metrics.timelineAdherence)}%
            </div>
            <p className="text-xs text-gray-500">
              {metrics.timelineAdherence < 80
                ? 'Behind schedule'
                : 'On schedule'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.riskScore > 70 ? 'text-red-600' : metrics.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {Math.round(metrics.riskScore)}
            </div>
            <p className="text-xs text-gray-500">
              {metrics.riskScore > 70
                ? 'High risk'
                : metrics.riskScore > 40
                  ? 'Medium risk'
                  : 'Low risk'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut
                data={taskCompletionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut
                data={budgetData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut
                data={riskGaugeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Estimated Completion
              </h4>
              <p className="text-lg font-semibold">
                {new Date(predictions.estimatedCompletion).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Budget Overrun Risk
              </h4>
              <div className="flex items-center">
                <div className="text-lg font-semibold mr-2">
                  {Math.round(predictions.budgetOverrunRisk)}%
                </div>
                <div
                  className={`w-16 h-2 rounded-full ${predictions.budgetOverrunRisk > 50 ? 'bg-red-200' : 'bg-green-200'}`}
                >
                  <div
                    className={`h-2 rounded-full ${predictions.budgetOverrunRisk > 50 ? 'bg-red-600' : 'bg-green-600'}`}
                    style={{ width: `${predictions.budgetOverrunRisk}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Timeline Delay Risk
              </h4>
              <div className="flex items-center">
                <div className="text-lg font-semibold mr-2">
                  {Math.round(predictions.timelineDelayRisk)}%
                </div>
                <div
                  className={`w-16 h-2 rounded-full ${predictions.timelineDelayRisk > 50 ? 'bg-red-200' : 'bg-green-200'}`}
                >
                  <div
                    className={`h-2 rounded-full ${predictions.timelineDelayRisk > 50 ? 'bg-red-600' : 'bg-green-600'}`}
                    style={{ width: `${predictions.timelineDelayRisk}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Quality Score
              </h4>
              <div className="flex items-center">
                <div className="text-lg font-semibold mr-2">
                  {Math.round(predictions.qualityScore)}/100
                </div>
                <div
                  className={`w-16 h-2 rounded-full ${predictions.qualityScore > 70 ? 'bg-green-200' : 'bg-yellow-200'}`}
                >
                  <div
                    className={`h-2 rounded-full ${predictions.qualityScore > 70 ? 'bg-green-600' : 'bg-yellow-600'}`}
                    style={{ width: `${predictions.qualityScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {predictions.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                  <span className="text-sm text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.teamProductivity.toFixed(1)}
            </div>
            <p className="text-sm text-gray-500">Tasks per person per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Task Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.round(metrics.averageTaskDuration)}
            </div>
            <p className="text-sm text-gray-500">Days per task</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Satisfaction Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(metrics.clientSatisfactionPrediction)}
            </div>
            <p className="text-sm text-gray-500">
              Predicted satisfaction score
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const OrganizationAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationAnalytics();
  }, []);

  const fetchOrganizationAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/organization/overview');

      if (!response.ok) {
        throw new Error('Failed to fetch organization analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">
            Error: {error || 'Failed to load analytics data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const revenueChartData = {
    labels: analytics.trends.revenue.map((t) => t.period),
    datasets: [
      {
        label: 'Revenue',
        data: analytics.trends.revenue.map((t) => t.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const productivityChartData = {
    labels: analytics.trends.teamProductivity.map((t) => t.period),
    datasets: [
      {
        label: 'Team Productivity',
        data: analytics.trends.teamProductivity.map((t) => t.value),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.totalProjects}
            </div>
            <p className="text-xs text-gray-500">
              {analytics.overview.activeProjects} active,{' '}
              {analytics.overview.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.overview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Lifetime revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Client Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.clientSatisfactionScore}/100
            </div>
            <p className="text-xs text-gray-500">Average satisfaction score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Productivity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line
                data={productivityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  High Risk Projects
                </span>
                <span
                  className={`font-semibold ${analytics.riskAnalysis.highRiskProjects > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {analytics.riskAnalysis.highRiskProjects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Budget Overruns</span>
                <span
                  className={`font-semibold ${analytics.riskAnalysis.budgetOverruns > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {analytics.riskAnalysis.budgetOverruns}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Timeline Delays</span>
                <span
                  className={`font-semibold ${analytics.riskAnalysis.timelineDelays > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {analytics.riskAnalysis.timelineDelays}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformers.map((performer, index) => (
                <div
                  key={performer.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{performer.name}</p>
                      <p className="text-xs text-gray-500">
                        {performer.completedTasks} tasks completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {performer.productivityScore}
                    </p>
                    <p className="text-xs text-gray-500">score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
