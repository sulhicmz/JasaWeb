import React, { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'project' | 'ticket' | 'milestone' | 'invoice';
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  priority?: string;
  dueDate?: Date;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'http://localhost:3001/dashboard/recent-activity?limit=10',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }

      const activitiesData = await response.json();
      setActivities(activitiesData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading activities:', error);
      }
      setError('Failed to load activity');
      // Set empty array on error to prevent infinite loading
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (
    type: string,
    status?: string,
    priority?: string
  ) => {
    const getIconColor = () => {
      if (type === 'ticket' && priority) {
        switch (priority.toLowerCase()) {
          case 'critical':
            return 'text-red-600';
          case 'high':
            return 'text-orange-600';
          case 'medium':
            return 'text-yellow-600';
          default:
            return 'text-gray-600';
        }
      }

      switch (type) {
        case 'project':
          return 'text-indigo-600';
        case 'ticket':
          return 'text-yellow-600';
        case 'milestone':
          return 'text-green-600';
        case 'invoice':
          return 'text-blue-600';
        default:
          return 'text-gray-600';
      }
    };

    const colorClass = getIconColor();

    const icons = {
      project: `<svg class="h-4 w-4 ${colorClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>`,
      ticket: `<svg class="h-4 w-4 ${colorClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>`,
      milestone: `<svg class="h-4 w-4 ${colorClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
      invoice: `<svg class="h-4 w-4 ${colorClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>`,
    };

    return icons[type as keyof typeof icons] || icons.project;
  };

  const formatTimeAgo = (timestamp: Date | string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'project':
        return `Project ${activity.status.toLowerCase()}`;
      case 'ticket':
        const priorityText = activity.priority
          ? ` (${activity.priority} priority)`
          : '';
        return `Ticket ${activity.status.toLowerCase()}${priorityText}`;
      case 'milestone':
        return `Milestone ${activity.status.toLowerCase()}`;
      case 'invoice':
        return `Invoice ${activity.status.toLowerCase()}`;
      default:
        return activity.description;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All →
          </button>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All →
          </button>
        </div>
        <div className="text-center py-8">
          <svg
            className="mx-auto h-8 w-8 text-gray-400"
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
          <p className="mt-2 text-gray-500 text-sm">Failed to load activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          View All →
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-8 w-8 text-gray-400"
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
          <p className="mt-2 text-gray-500 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: getActivityIcon(
                        activity.type,
                        activity.status,
                        activity.priority
                      ),
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.title}</span>
                  {activity.priority &&
                    activity.priority.toLowerCase() === 'critical' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Critical
                      </span>
                    )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
