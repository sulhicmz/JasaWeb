import React from 'react';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../Card';
import { cn } from '../../lib/utils';

export interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
    progress: number;
    startDate: string;
    endDate?: string;
    budget?: number;
    client?: string;
    teamMembers?: number;
  };
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  planning: {
    label: 'Planning',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '📋',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800',
    icon: '🚀',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-gray-100 text-gray-800',
    icon: '⏸️',
  },
};

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  const statusInfo = statusConfig[project.status];

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-3',
              statusInfo.color
            )}
          >
            <span className="mr-1">{statusInfo.icon}</span>
            {statusInfo.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {new Date(project.startDate).toLocaleDateString()} -{' '}
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString()
                : 'Ongoing'}
            </span>
          </div>

          {project.budget && (
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>${project.budget.toLocaleString()}</span>
            </div>
          )}

          {project.client && (
            <div className="flex items-center text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{project.client}</span>
            </div>
          )}

          {project.teamMembers && (
            <div className="flex items-center text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{project.teamMembers} team members</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export interface ProjectGridProps {
  projects: ProjectCardProps['project'][];
  onProjectClick?: (project: ProjectCardProps['project']) => void;
  className?: string;
}

export function ProjectGrid({
  projects,
  onProjectClick,
  className,
}: ProjectGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        className
      )}
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onProjectClick?.(project)}
        />
      ))}
    </div>
  );
}
