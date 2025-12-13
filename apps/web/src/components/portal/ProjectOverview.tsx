import React, { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  openTickets: number;
  highPriorityTickets: number;
  createdAt?: string;
  updatedAt?: string;
  startAt?: string;
  dueAt?: string;
}

const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();

    // Listen for reload events
    window.addEventListener('reloadProjects', loadProjects);
    return () => window.removeEventListener('reloadProjects', loadProjects);
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'http://localhost:3001/dashboard/projects-overview?limit=6',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects overview');
      }

      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading projects:', error);
      }
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Progress is now calculated on the backend and included in the project data

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Project Overview
          </h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All Projects →
          </button>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Project Overview
          </h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All Projects →
          </button>
        </div>
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-gray-500">Failed to load projects</p>
          <button
            onClick={loadProjects}
            className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Project Overview
        </h2>
        <button
          onClick={() => (window.location.href = '/portal/projects')}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          View All Projects →
        </button>
      </div>

      {projects.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="mt-2 text-gray-500">No projects found</p>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent('openCreateProjectModal'))
            }
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {project.description || 'No description'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                >
                  {project.status || 'Active'}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex space-x-4">
                  <span className="text-gray-500">
                    <svg
                      className="inline h-4 w-4 mr-1"
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
                    {project.completedMilestones}/{project.totalMilestones}{' '}
                    milestones
                  </span>
                  <span className="text-gray-500">
                    <svg
                      className="inline h-4 w-4 mr-1"
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
                    {project.openTickets} tickets
                  </span>
                </div>
                <button
                  onClick={() =>
                    (window.location.href = `/portal/projects/${project.id}`)
                  }
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View →
                </button>
              </div>

              {/* Show high priority tickets indicator */}
              {project.highPriorityTickets > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ {project.highPriorityTickets} high priority ticket
                  {project.highPriorityTickets > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;
