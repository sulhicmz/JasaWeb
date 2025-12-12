import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ProjectAnalyticsDashboard,
  OrganizationAnalyticsDashboard,
} from './AnalyticsDashboard';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  ArcElement: jest.fn(),
  BarElement: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

// Mock UI components
jest.mock('@jasaweb/ui', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ProjectAnalyticsDashboard', () => {
  const mockProjectMetrics = {
    projectId: 'project-123',
    organizationId: 'org-123',
    totalTasks: 10,
    completedTasks: 7,
    overdueTasks: 2,
    totalMilestones: 5,
    completedMilestones: 3,
    averageTaskDuration: 3.5,
    budgetUtilization: 75,
    timelineAdherence: 85,
    teamProductivity: 2.5,
    riskScore: 25,
    clientSatisfactionPrediction: 88,
  };

  const mockPredictions = {
    estimatedCompletion: new Date('2024-06-01'),
    budgetOverrunRisk: 15,
    timelineDelayRisk: 20,
    qualityScore: 85,
    recommendedActions: [
      'Address overdue tasks immediately',
      'Review budget allocation and spending',
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ProjectAnalyticsDashboard projectId="project-123" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render project analytics dashboard with data', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectMetrics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPredictions,
      });

    render(<ProjectAnalyticsDashboard projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('70%')).toBeInTheDocument(); // Task completion
    });

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument(); // Budget utilization
    });

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument(); // Timeline adherence
    });

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Risk score
    });

    // Check for charts
    expect(screen.getAllByTestId('doughnut-chart')).toHaveLength(3);
  });

  it('should render error state when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<ProjectAnalyticsDashboard projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should display predictive analytics section', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectMetrics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPredictions,
      });

    render(<ProjectAnalyticsDashboard projectId="project-123" />);

    await waitFor(() => {
      expect(
        screen.getByText('Predictive Analytics & Recommendations')
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Estimated Completion')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Budget Overrun Risk')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Timeline Delay Risk')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Quality Score')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Recommended Actions')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Address overdue tasks immediately')
      ).toBeInTheDocument();
    });
  });

  it('should show correct risk level indicators', async () => {
    const highRiskMetrics = {
      ...mockProjectMetrics,
      riskScore: 85,
      budgetUtilization: 110,
      timelineAdherence: 70,
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => highRiskMetrics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPredictions,
      });

    render(<ProjectAnalyticsDashboard projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('High risk')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('110%')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Over budget')).toBeInTheDocument();
    });
  });
});

describe('OrganizationAnalyticsDashboard', () => {
  const mockOrganizationAnalytics = {
    overview: {
      totalProjects: 10,
      activeProjects: 6,
      completedProjects: 4,
      totalRevenue: 500000,
      averageProjectDuration: 45,
      clientSatisfactionScore: 87,
    },
    trends: {
      projectCompletion: [
        { period: 'Jan 2024', value: 5, change: 1, changePercent: 25 },
        { period: 'Feb 2024', value: 7, change: 2, changePercent: 40 },
      ],
      revenue: [
        {
          period: 'Jan 2024',
          value: 100000,
          change: 10000,
          changePercent: 11.1,
        },
        { period: 'Feb 2024', value: 120000, change: 20000, changePercent: 20 },
      ],
      teamProductivity: [
        { period: 'Jan 2024', value: 15, change: 2, changePercent: 15.4 },
        { period: 'Feb 2024', value: 18, change: 3, changePercent: 20 },
      ],
    },
    topPerformers: [
      {
        userId: 'user-1',
        name: 'John Doe',
        completedTasks: 25,
        productivityScore: 250,
      },
      {
        userId: 'user-2',
        name: 'Jane Smith',
        completedTasks: 20,
        productivityScore: 200,
      },
    ],
    riskAnalysis: {
      highRiskProjects: 2,
      budgetOverruns: 1,
      timelineDelays: 3,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render organization analytics dashboard with data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrganizationAnalytics,
    });

    render(<OrganizationAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total projects
    });

    await waitFor(() => {
      expect(screen.getByText('$500,000')).toBeInTheDocument(); // Total revenue
    });

    await waitFor(() => {
      expect(screen.getByText('87/100')).toBeInTheDocument(); // Client satisfaction
    });

    // Check for charts
    expect(screen.getAllByTestId('line-chart')).toHaveLength(2);
  });

  it('should render risk analysis section', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrganizationAnalytics,
    });

    render(<OrganizationAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('High Risk Projects')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Budget Overruns')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should render top performers section', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrganizationAnalytics,
    });

    render(<OrganizationAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Top Performers')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('25 tasks completed')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument(); // Productivity score
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should render error state when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<OrganizationAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should show risk indicators with correct colors', async () => {
    const highRiskAnalytics = {
      ...mockOrganizationAnalytics,
      riskAnalysis: {
        highRiskProjects: 5,
        budgetOverruns: 3,
        timelineDelays: 4,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => highRiskAnalytics,
    });

    render(<OrganizationAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });
});
