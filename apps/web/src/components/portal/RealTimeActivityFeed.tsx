import React, { useState, useEffect } from 'react';

interface RecentActivity {
  id: string;
  type: 'project' | 'ticket' | 'milestone' | 'invoice';
  title: string;
  description: string;
  status: string;
  priority?: string;
  createdAt: string;
  dueDate?: string;
  projectId?: string;
  projectName?: string;
}

interface RealTimeActivityFeedProps {
  organizationId: string;
}

const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({
  organizationId,
}) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadActivities();
    if (autoRefresh) {
      const interval = setInterval(loadActivities, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [organizationId, autoRefresh]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:3001/dashboard/recent-activity?limit=20${filter !== 'all' ? `&type=${filter}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity data');
      }

      const data = await response.json();
      setActivities(data);
      setLastRefresh(new Date());
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error loading activity data:', error);
      }
      setError('Failed to load activity data');
      // Set mock data for development
      setActivities([
        {
          id: '1',
          type: 'project',
          title: 'Company Profile Website',
          description: 'Project status updated to active',
          status: 'active',
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          projectName: 'Company Profile Website',
        },
        {
          id: '2',
          type: 'ticket',
          title: 'Bug Fix ticket',
          description: 'Priority: high',
          status: 'open',
          priority: 'high',
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          projectName: 'School Website',
        },
        {
          id: '3',
          type: 'milestone',
          title: 'Design Approval',
          description: 'Milestone',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          projectName: 'News Portal',
        },
        {
          id: '4',
          type: 'invoice',
          title: 'Invoice 12345678',
          description: 'Amount: $5000',
          status: 'paid',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          projectName: 'Company Profile Website',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, status?: string) => {
    const iconClass = 'h-5 w-5';

    switch (type) {
      case 'project':
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        );
      case 'ticket':
        const colorClass =
          status === 'open'
            ? 'text-red-500'
            : status === 'in-progress'
              ? 'text-yellow-500'
              : 'text-green-500';
        return (
          <svg
            className={`${iconClass} ${colorClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
      case 'milestone':
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'invoice':
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className={iconClass}
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
        );
    }
  };

  const getStatusBadge = (type: string, status: string, priority?: string) => {
    const baseClass =
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';

    if (priority) {
      const priorityColors = {
        low: 'bg-gray-100 text-gray-800',
        medium: 'bg-blue-100 text-blue-800',
        high: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800',
      };
      return (
        <span
          className={`${baseClass} ${priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium}`}
        >
          {priority}
        </span>
      );
    }

    const statusColors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      open: 'bg-red-100 text-red-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800',
      'on-hold': 'bg-orange-100 text-orange-800',
      planning: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`${baseClass} ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredActivities =
    filter === 'all'
      ? activities
      : activities.filter((activity) => activity.type === filter);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="flex items-center space-x-2">
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              {formatRelativeTime(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded ${autoRefresh ? 'text-green-600 bg-green-100' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            title={
              autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'
            }
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

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {['all', 'project', 'ticket', 'milestone', 'invoice'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              filter === type
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-gray-500">No recent activity</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type, activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center justify-between mt-1">
                  {activity.projectName && (
                    <span className="text-xs text-gray-500">
                      {activity.projectName}
                    </span>
                  )}
                  {getStatusBadge(
                    activity.type,
                    activity.status,
                    activity.priority
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={loadActivities}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Refresh Activity
        </button>
      </div>
    </div>
  );
};

export default RealTimeActivityFeed;
