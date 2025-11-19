import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

const variantClasses = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  danger: 'bg-red-600',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  showPercentage = true,
  animated = false,
  striped = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variantClasses[variant],
            animated && 'animate-pulse',
            striped &&
              'bg-gradient-to-r from-transparent via-white to-transparent bg-[length:1rem_1rem] animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface MilestoneProps {
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  dueDate?: string;
  progress?: number;
}

export interface MilestoneProgressProps {
  milestones: MilestoneProps[];
  showDates?: boolean;
  showProgress?: boolean;
  className?: string;
}

const statusConfig = {
  completed: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✓',
  },
  in_progress: {
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '⚡',
  },
  pending: {
    color: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '⏳',
  },
  overdue: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '⚠️',
  },
};

export function MilestoneProgress({
  milestones,
  showDates = true,
  showProgress = true,
  className,
}: MilestoneProgressProps) {
  const completedCount = milestones.filter(
    (m) => m.status === 'completed'
  ).length;
  const overallProgress = (completedCount / milestones.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm text-gray-600">
            {completedCount}/{milestones.length} completed
          </span>
        </div>
        <ProgressBar value={overallProgress} showPercentage={true} />
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const config = statusConfig[milestone.status];

          return (
            <div key={index} className="flex items-start space-x-3">
              {/* Status Indicator */}
              <div className="flex-shrink-0 mt-1">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 border-white shadow-sm',
                    config.color
                  )}
                >
                  <span className="flex items-center justify-center text-white text-xs">
                    {config.icon}
                  </span>
                </div>

                {/* Connector Line */}
                {index < milestones.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-2" />
                )}
              </div>

              {/* Milestone Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {milestone.title}
                  </h4>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      config.bgColor,
                      config.textColor
                    )}
                  >
                    {milestone.status.replace('_', ' ')}
                  </span>
                </div>

                {milestone.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {milestone.description}
                  </p>
                )}

                {showDates && milestone.dueDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </p>
                )}

                {showProgress && milestone.progress !== undefined && (
                  <div className="mt-2">
                    <ProgressBar
                      value={milestone.progress}
                      size="sm"
                      variant={
                        milestone.status === 'completed' ? 'success' : 'default'
                      }
                      showPercentage={true}
                      showLabel={false}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface TaskProgressProps {
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    subtasks?: {
      id: string;
      title: string;
      completed: boolean;
    }[];
  }[];
  onTaskToggle?: (taskId: string) => void;
  onSubtaskToggle?: (taskId: string, subtaskId: string) => void;
  className?: string;
}

export function TaskProgress({
  tasks,
  onTaskToggle,
  onSubtaskToggle,
  className,
}: TaskProgressProps) {
  const completedTasks = tasks.filter((task) => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.completed;
    }
    return task.subtasks.every((subtask) => subtask.completed);
  }).length;

  const overallProgress = (completedTasks / tasks.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Task Progress
          </span>
          <span className="text-sm text-gray-600">
            {completedTasks}/{tasks.length} completed
          </span>
        </div>
        <ProgressBar value={overallProgress} showPercentage={true} />
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const completedSubtasks =
            task.subtasks?.filter((st) => st.completed).length || 0;
          const totalSubtasks = task.subtasks?.length || 0;
          const taskCompleted =
            totalSubtasks === 0
              ? task.completed
              : completedSubtasks === totalSubtasks;

          return (
            <div
              key={task.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={taskCompleted}
                  onChange={() => onTaskToggle?.(task.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <h4
                    className={cn(
                      'text-sm font-medium',
                      taskCompleted
                        ? 'text-gray-500 line-through'
                        : 'text-gray-900'
                    )}
                  >
                    {task.title}
                  </h4>

                  {totalSubtasks > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">
                        {completedSubtasks}/{totalSubtasks} subtasks completed
                      </span>
                      <ProgressBar
                        value={
                          totalSubtasks > 0
                            ? (completedSubtasks / totalSubtasks) * 100
                            : 0
                        }
                        size="sm"
                        className="mt-1"
                        showLabel={false}
                        showPercentage={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3 ml-7 space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => onSubtaskToggle?.(task.id, subtask.id)}
                        className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span
                        className={cn(
                          'text-xs',
                          subtask.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-700'
                        )}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
