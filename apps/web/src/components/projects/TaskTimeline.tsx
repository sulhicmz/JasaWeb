import React, { useState, useEffect, useMemo } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  startAt?: string;
  dueAt?: string;
  completedAt?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  subtasks: Array<{
    id: string;
    title: string;
    startAt?: string;
    dueAt?: string;
    status: string;
  }>;
  dependencies: Array<{
    dependsOnTask: {
      id: string;
      title: string;
      status: string;
    };
    type: string;
  }>;
}

interface TaskTimelineProps {
  projectId: string;
  tasks: Task[];
}

const TaskTimeline: React.FC<TaskTimelineProps> = ({ projectId, tasks }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Calculate date range
  const dateRange = useMemo(() => {
    if (tasks.length === 0) return { start: new Date(), end: new Date() };

    const dates = tasks
      .flatMap((task) => [
        task.startAt ? new Date(task.startAt) : null,
        task.dueAt ? new Date(task.dueAt) : null,
      ])
      .filter(Boolean) as Date[];

    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    const start = new Date(minDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const end = new Date(maxDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    return { start, end };
  }, [tasks]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    const { start, end } = dateRange;
    const current = new Date(start);

    while (current <= end) {
      slots.push(new Date(current));

      if (viewMode === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return slots;
  }, [dateRange, viewMode]);

  // Calculate task position and width
  const getTaskPosition = (task: Task) => {
    const { start, end } = dateRange;
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const taskStart = task.startAt ? new Date(task.startAt) : new Date();
    const taskEnd = task.dueAt
      ? new Date(task.dueAt)
      : new Date(taskStart.getTime() + 24 * 60 * 60 * 1000);

    const startOffset = Math.max(
      0,
      Math.ceil((taskStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const duration = Math.max(
      1,
      Math.ceil(
        (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.min(100 - (startOffset / totalDays) * 100, (duration / totalDays) * 100)}%`,
    };
  };

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  // Status colors
  const statusColors = {
    todo: 'bg-gray-600',
    'in-progress': 'bg-blue-600',
    review: 'bg-yellow-600',
    done: 'bg-green-600',
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date) => {
    if (viewMode === 'day') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else if (viewMode === 'week') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const TaskRow: React.FC<{ task: Task; level?: number }> = ({
    task,
    level = 0,
  }) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks.length > 0;
    const position = getTaskPosition(task);

    return (
      <>
        <div className="flex items-center border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
          {/* Task Info */}
          <div
            className="w-80 px-4 py-3 flex items-center space-x-3"
            style={{ paddingLeft: `${16 + level * 20}px` }}
          >
            {hasSubtasks && (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i
                  className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-xs`}
                ></i>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}
                ></div>
                <h4 className="text-white font-medium truncate">
                  {task.title}
                </h4>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {task.assignee && (
                  <div className="flex items-center space-x-1">
                    <img
                      src={
                        task.assignee.profilePicture ||
                        `https://ui-avatars.com/api/?name=${task.assignee.name}&background=3b82f6&color=fff`
                      }
                      alt={task.assignee.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-xs text-gray-400">
                      {task.assignee.name}
                    </span>
                  </div>
                )}
                {task.estimatedHours && (
                  <span className="text-xs text-gray-400">
                    {task.estimatedHours}h
                    {task.actualHours && (
                      <span className="text-blue-400">
                        ({task.actualHours}h)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gantt Chart */}
          <div className="flex-1 relative h-12 flex items-center">
            {/* Grid lines */}
            {timeSlots.map((slot, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 border-l border-slate-800"
                style={{ left: `${(index / timeSlots.length) * 100}%` }}
              />
            ))}

            {/* Task bar */}
            <div
              className={`absolute h-6 rounded ${statusColors[task.status]} cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2`}
              style={position}
              onClick={() => setSelectedTask(task)}
            >
              <span className="text-white text-xs truncate">{task.title}</span>
            </div>

            {/* Dependencies */}
            {task.dependencies.map((dep, index) => (
              <div
                key={index}
                className="absolute top-1/2 transform -translate-y-1/2 text-gray-500"
                style={{
                  left: position.left,
                  marginLeft: '-20px',
                }}
              >
                <i className="fas fa-arrow-right text-xs"></i>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="w-48 px-4 py-3 text-right">
            <div className="text-xs text-gray-400">
              {task.startAt
                ? new Date(task.startAt).toLocaleDateString()
                : 'No start date'}
            </div>
            <div className="text-xs text-gray-400">
              {task.dueAt
                ? new Date(task.dueAt).toLocaleDateString()
                : 'No due date'}
            </div>
          </div>
        </div>

        {/* Subtasks */}
        {hasSubtasks &&
          isExpanded &&
          task.subtasks.map((subtask) => (
            <TaskRow
              key={subtask.id}
              task={{
                ...task,
                id: subtask.id,
                title: subtask.title,
                startAt: subtask.startAt,
                dueAt: subtask.dueAt,
                status: subtask.status as Task['status'],
                subtasks: [],
                dependencies: [],
              }}
              level={level + 1}
            />
          ))}
      </>
    );
  };

  return (
    <div className="task-timeline bg-slate-900 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Task Timeline</h2>
        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span className="text-gray-400">Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-400">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-gray-400">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-400">Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex border-b border-slate-800 mb-4">
        <div className="w-80 px-4 py-2">
          <h3 className="text-sm font-medium text-gray-400">Task</h3>
        </div>
        <div className="flex-1 relative">
          <div className="flex">
            {timeSlots.map((slot, index) => (
              <div
                key={index}
                className="flex-1 text-center px-2 py-2 border-l border-slate-800 first:border-l-0"
              >
                <div className="text-xs text-gray-400">{formatDate(slot)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-48 px-4 py-2 text-right">
          <h3 className="text-sm font-medium text-gray-400">Dates</h3>
        </div>
      </div>

      {/* Task Rows */}
      <div className="min-h-[400px]">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-tasks text-4xl mb-4"></i>
            <p>No tasks to display in timeline</p>
          </div>
        ) : (
          <div>
            {tasks
              .filter((task) => task.startAt || task.dueAt) // Only show tasks with dates
              .map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedTask.title}
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <p className="text-white capitalize">
                    {selectedTask.status.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Priority</label>
                  <p className="text-white capitalize">
                    {selectedTask.priority}
                  </p>
                </div>
              </div>

              {selectedTask.assignee && (
                <div>
                  <label className="text-sm text-gray-400">Assignee</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <img
                      src={
                        selectedTask.assignee.profilePicture ||
                        `https://ui-avatars.com/api/?name=${selectedTask.assignee.name}&background=3b82f6&color=fff`
                      }
                      alt={selectedTask.assignee.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <p className="text-white">{selectedTask.assignee.name}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Start Date</label>
                  <p className="text-white">
                    {selectedTask.startAt
                      ? new Date(selectedTask.startAt).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Due Date</label>
                  <p className="text-white">
                    {selectedTask.dueAt
                      ? new Date(selectedTask.dueAt).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
              </div>

              {(selectedTask.estimatedHours || selectedTask.actualHours) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">
                      Estimated Hours
                    </label>
                    <p className="text-white">
                      {selectedTask.estimatedHours || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      Actual Hours
                    </label>
                    <p className="text-white">
                      {selectedTask.actualHours || 'Not set'}
                    </p>
                  </div>
                </div>
              )}

              {selectedTask.dependencies.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400">Dependencies</label>
                  <ul className="mt-1 space-y-1">
                    {selectedTask.dependencies.map((dep, index) => (
                      <li key={index} className="text-white text-sm">
                        → {dep.dependsOnTask.title} ({dep.type})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimeline;
