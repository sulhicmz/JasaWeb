import React, { useState, useEffect } from 'react';

interface MobileDashboardProps {
  className?: string;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    pendingApprovals: 0,
    unreadMessages: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [quickActions, setQuickActions] = useState([
    {
      id: 1,
      title: 'New Project',
      icon: 'fa-plus',
      color: 'bg-blue-500',
      href: '/portal/projects/new',
    },
    {
      id: 2,
      title: 'Upload File',
      icon: 'fa-upload',
      color: 'bg-green-500',
      href: '/portal/files/upload',
    },
    {
      id: 3,
      title: 'Request Approval',
      icon: 'fa-check-circle',
      color: 'bg-purple-500',
      href: '/portal/approvals/new',
    },
    {
      id: 4,
      title: 'Create Ticket',
      icon: 'fa-ticket-alt',
      color: 'bg-orange-500',
      href: '/portal/tickets/new',
    },
  ]);

  useEffect(() => {
    // Simulate loading data
    const loadDashboardData = async () => {
      try {
        // In a real app, these would be API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStats({
          activeProjects: 3,
          completedProjects: 12,
          pendingApprovals: 2,
          unreadMessages: 5,
        });

        setRecentProjects([
          {
            id: 1,
            name: 'Company Website',
            status: 'In Progress',
            progress: 75,
            lastUpdate: '2 hours ago',
          },
          {
            id: 2,
            name: 'E-commerce Platform',
            status: 'Review',
            progress: 90,
            lastUpdate: '1 day ago',
          },
          {
            id: 3,
            name: 'Mobile App Design',
            status: 'Planning',
            progress: 25,
            lastUpdate: '3 days ago',
          },
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Reload data
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-4 shadow-sm animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pull to Refresh Indicator */}
      <div className="flex justify-center">
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Refresh"
        >
          <i className="fas fa-sync-alt text-lg"></i>
        </button>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">Welcome back! 👋</h2>
        <p className="text-blue-100 text-sm">
          You have {stats.pendingApprovals} items awaiting your approval
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-folder-open text-blue-600"></i>
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.activeProjects}
          </div>
          <div className="text-xs text-gray-600">Projects</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.completedProjects}
          </div>
          <div className="text-xs text-gray-600">Projects</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-clock text-purple-600"></i>
            </div>
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.pendingApprovals}
          </div>
          <div className="text-xs text-gray-600">Approvals</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="fas fa-envelope text-orange-600"></i>
            </div>
            <span className="text-xs text-gray-500">Unread</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.unreadMessages}
          </div>
          <div className="text-xs text-gray-600">Messages</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-4 gap-4 p-4">
          {quickActions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div
                className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <i className={`fas ${action.icon} text-white text-lg`}></i>
              </div>
              <span className="text-xs text-gray-700 text-center font-medium">
                {action.title}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Projects</h3>
          <a
            href="/portal/projects"
            className="text-blue-600 text-sm hover:text-blue-700"
          >
            View All
          </a>
        </div>
        <div className="divide-y divide-gray-100">
          {recentProjects.map((project) => (
            <a
              key={project.id}
              href={`/portal/projects/${project.id}`}
              className="p-4 hover:bg-gray-50 transition-colors block"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.lastUpdate}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-700'
                      : project.status === 'Review'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs font-medium text-gray-900">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-green-600 text-xs"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Project milestone completed
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Company Website - Design Phase
                </p>
                <p className="text-xs text-gray-400 mt-1">30 minutes ago</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-comment text-blue-600 text-xs"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  New comment on your project
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  E-commerce Platform
                </p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-upload text-purple-600 text-xs"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New files uploaded</p>
                <p className="text-xs text-gray-500 mt-1">
                  Mobile App Design - 3 files
                </p>
                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
