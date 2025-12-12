import React, { useState, useEffect } from 'react';

interface ProjectOverview {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  openTickets: number;
  highPriorityTickets: number;
  createdAt: string;
  updatedAt: string;
  startAt?: string;
  dueAt?: string;
  nextMilestoneDue?: string;
  health: 'excellent' | 'good' | 'at-risk' | 'critical';
}

interface EnhancedProjectOverviewProps {
  organizationId: string;
}

const EnhancedProjectOverview: React.FC<EnhancedProjectOverviewProps> = ({
  organizationId,
}) => {
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, [organizationId, sortBy, sortOrder, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        limit: '10',
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(
        `http://localhost:3001/dashboard/projects-overview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error loading project data:', error);
      }
      setError('Failed to load project data');
      // Set mock data for development
      setProjects([
        {
          id: '1',
          name: 'Company Profile Website',
          status: 'active',
          progress: 75,
          totalMilestones: 8,
          completedMilestones: 6,
          openTickets: 2,
          highPriorityTickets: 0,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 30
          ).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          startAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 20
          ).toISOString(),
          dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
          nextMilestoneDue: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 3
          ).toISOString(),
          health: 'good',
        },
        {
          id: '2',
          name: 'School Website Redesign',
          status: 'active',
          progress: 45,
          totalMilestones: 10,
          completedMilestones: 4,
          openTickets: 5,
          highPriorityTickets: 2,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 45
          ).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          startAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 35
          ).toISOString(),
          dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
          nextMilestoneDue: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 5
          ).toISOString(),
          health: 'at-risk',
        },
        {
          id: '3',
          name: 'News Portal Development',
          status: 'completed',
          progress: 100,
          totalMilestones: 12,
          completedMilestones: 12,
          openTickets: 0,
          highPriorityTickets: 0,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 60
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5
          ).toISOString(),
          startAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 50
          ).toISOString(),
          dueAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          health: 'excellent',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'at-risk':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'on-hold':
        return 'text-orange-600 bg-orange-100';
      case 'planning':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Project Overview
          </h3>
          <button
            onClick={loadProjects}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh projects"
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

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 space-y-3 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'completed', 'on-hold', 'planning'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
              <option value="dueAt">Due Date</option>
              <option value="health">Health</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {sortOrder === 'asc' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {projects.length === 0 ? (
          <div className="p-6 text-center">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="mt-2 text-gray-500">No projects found</p>
          </div>
        ) : (
          projects.map((project) => {
            const daysRemaining = getDaysRemaining(project.dueAt);
            const overdue = isOverdue(project.dueAt);

            return (
              <div
                key={project.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-base font-medium text-gray-900">
                        {project.name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getHealthColor(project.health)}`}
                      >
                        {project.health.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Milestones:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {project.completedMilestones}/
                          {project.totalMilestones}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Open Tickets:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {project.openTickets}
                          {project.highPriorityTickets > 0 && (
                            <span className="text-red-600 ml-1">
                              ({project.highPriorityTickets} high)
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <span
                          className={`ml-1 font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}
                        >
                          {project.dueAt
                            ? formatDate(project.dueAt)
                            : 'No due date'}
                          {daysRemaining !== null && !overdue && (
                            <span className="text-gray-500 ml-1">
                              ({daysRemaining}d left)
                            </span>
                          )}
                          {overdue && (
                            <span className="text-red-600 ml-1">(overdue)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Milestone:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {project.nextMilestoneDue
                            ? formatDate(project.nextMilestoneDue)
                            : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200">
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

export default EnhancedProjectOverview;
