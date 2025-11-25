import React, { useState, useEffect } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed';
  progress: number;
  lastUpdate: string;
  dueDate: string;
  team: Array<{ name: string; avatar: string }>;
}

const MobileProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setProjects([
          {
            id: 1,
            name: 'Company Website',
            description: 'Corporate website redesign with modern UI/UX',
            status: 'In Progress',
            progress: 75,
            lastUpdate: '2 hours ago',
            dueDate: '2024-02-15',
            team: [
              { name: 'John Doe', avatar: 'JD' },
              { name: 'Jane Smith', avatar: 'JS' },
            ],
          },
          {
            id: 2,
            name: 'E-commerce Platform',
            description:
              'Full-stack e-commerce solution with payment integration',
            status: 'Review',
            progress: 90,
            lastUpdate: '1 day ago',
            dueDate: '2024-01-30',
            team: [
              { name: 'Mike Johnson', avatar: 'MJ' },
              { name: 'Sarah Wilson', avatar: 'SW' },
            ],
          },
          {
            id: 3,
            name: 'Mobile App Design',
            description: 'iOS and Android app design and development',
            status: 'Planning',
            progress: 25,
            lastUpdate: '3 days ago',
            dueDate: '2024-03-01',
            team: [{ name: 'Alex Brown', avatar: 'AB' }],
          },
          {
            id: 4,
            name: 'News Portal',
            description: 'Content management system for news website',
            status: 'Completed',
            progress: 100,
            lastUpdate: '1 week ago',
            dueDate: '2024-01-15',
            team: [
              { name: 'Tom Davis', avatar: 'TD' },
              { name: 'Emma Lee', avatar: 'EL' },
            ],
          },
        ]);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      filter === 'all' ||
      project.status.toLowerCase().replace(' ', '-') === filter;
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Review':
        return 'bg-yellow-100 text-yellow-700';
      case 'Planning':
        return 'bg-gray-100 text-gray-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-4 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'planning', 'in-progress', 'review', 'completed'].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all'
                  ? 'All'
                  : f
                      .split('-')
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <a
            key={project.id}
            href={`/portal/projects/${project.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)} ml-3`}
                >
                  {project.status}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(project.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Update</p>
                  <p className="text-sm font-medium text-gray-900">
                    {project.lastUpdate}
                  </p>
                </div>
              </div>

              {/* Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Team:</p>
                  <div className="flex -space-x-2">
                    {project.team.map((member, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                        title={member.name}
                      >
                        {member.avatar}
                      </div>
                    ))}
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </div>

            {/* Touch-friendly Action Bar */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
              <div className="flex justify-around">
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <i className="fas fa-eye text-lg"></i>
                  <span className="text-xs">View</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <i className="fas fa-edit text-lg"></i>
                  <span className="text-xs">Edit</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <i className="fas fa-comment text-lg"></i>
                  <span className="text-xs">Chat</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <i className="fas fa-ellipsis-v text-lg"></i>
                  <span className="text-xs">More</span>
                </button>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-100">
          <i className="fas fa-folder-open text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first project'}
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <i className="fas fa-plus mr-2"></i>
            New Project
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors z-30">
        <i className="fas fa-plus text-lg"></i>
      </button>
    </div>
  );
};

export default MobileProjects;
