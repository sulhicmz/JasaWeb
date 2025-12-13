import React, { useState, useEffect } from 'react';
import { StatsCard } from '@jasaweb/ui';

interface DashboardStatsData {
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    highPriority: number;
    critical: number;
  };
  invoices: {
    total: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    pendingAmount: number;
  };
  milestones: {
    total: number;
    completed: number;
    overdue: number;
    dueThisWeek: number;
  };
}

const DashboardStatsReact: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call - replace with actual API
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Use mock data as fallback
      setStats({
        projects: { total: 24, active: 18, completed: 5, onHold: 1 },
        tickets: {
          total: 142,
          open: 23,
          inProgress: 45,
          highPriority: 8,
          critical: 3,
        },
        invoices: {
          total: 18,
          pending: 5,
          overdue: 2,
          totalAmount: 125000,
          pendingAmount: 35000,
        },
        milestones: { total: 67, completed: 45, overdue: 3, dueThisWeek: 8 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen for refresh events
    const handleRefresh = () => fetchStats();
    window.addEventListener('refresh-dashboard', handleRefresh);

    // Listen for real-time stats updates
    const handleStatsUpdate = (e: CustomEvent) => {
      setStats(e.detail);
    };
    window.addEventListener(
      'stats-updated',
      handleStatsUpdate as EventListener
    );

    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
      window.removeEventListener(
        'stats-updated',
        handleStatsUpdate as EventListener
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl animate-pulse">
            <div className="h-4 bg-slate-700 rounded mb-2 w-1/2"></div>
            <div className="h-8 bg-slate-700 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-xl border-red-500/30">
        <div className="flex items-center space-x-3 text-red-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>Error loading stats: {error}</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Projects Stats */}
      <StatsCard
        title="Total Projects"
        value={stats.projects.total}
        change={{
          value: 12.5,
          type: 'increase',
        }}
        description={`${stats.projects.active} active, ${stats.projects.completed} completed`}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
      />

      {/* Tickets Stats */}
      <StatsCard
        title="Open Tickets"
        value={stats.tickets.open}
        change={{
          value: -8.2,
          type: 'decrease',
        }}
        description={`${stats.tickets.highPriority} high priority`}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
        }
      />

      {/* Invoices Stats */}
      <StatsCard
        title="Pending Invoices"
        value={stats.invoices.pending}
        change={{
          value: 5.1,
          type: 'increase',
        }}
        description={`${stats.invoices.overdue} overdue`}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
      />

      {/* Milestones Stats */}
      <StatsCard
        title="Due This Week"
        value={stats.milestones.dueThisWeek}
        change={{
          value: 0,
          type: 'neutral',
        }}
        description={`${stats.milestones.overdue} overdue`}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
      />
    </div>
  );
};

export default DashboardStatsReact;
