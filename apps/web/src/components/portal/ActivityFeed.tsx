import React, { useState, useEffect } from 'react';

interface Activity {
  id: number;
  type: 'project' | 'ticket' | 'milestone' | 'invoice' | 'approval';
  action: string;
  title: string;
  description: string;
  timestamp: Date;
  user: string;
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

      // Mock activities - in real implementation this would fetch from an activity API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'project',
          action: 'updated',
          title: 'Website Redesign Project',
          description: 'Project status changed to In Progress',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: 'John Doe',
        },
        {
          id: 2,
          type: 'ticket',
          action: 'created',
          title: 'Fix navigation menu bug',
          description: 'New high priority ticket created',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: 'Jane Smith',
        },
        {
          id: 3,
          type: 'milestone',
          action: 'completed',
          title: 'Design Phase',
          description: 'Milestone marked as completed',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          user: 'Mike Johnson',
        },
        {
          id: 4,
          type: 'invoice',
          action: 'paid',
          title: 'INV-2024-001',
          description: 'Invoice marked as paid',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          user: 'System',
        },
        {
          id: 5,
          type: 'approval',
          action: 'approved',
          title: 'Homepage Design',
          description: 'Design mockup approved',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          user: 'Sarah Wilson',
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      project: `<svg class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>`,
      ticket: `<svg class="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>`,
      milestone: `<svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
      invoice: `<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>`,
      approval: `<svg class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>`,
    };

    return icons[type as keyof typeof icons] || icons.project;
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
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
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: getActivityIcon(activity.type),
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-gray-500"> {activity.action}</span>
                  <span className="font-medium"> {activity.title}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(activity.timestamp)}
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
