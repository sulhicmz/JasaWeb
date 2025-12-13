import React, { useState, useEffect, useCallback } from 'react';
import TaskDetailsModal from './TaskDetailsModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  dueAt?: string;
  startAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  tags: string[];
  parentTaskId?: string;
  milestoneId?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    author: {
      name: string;
    };
    createdAt: string;
  }>;
  _count?: {
    subtasks: number;
    comments: number;
  };
}

interface TaskBoardProps {
  projectId: string;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-gray-600' },
    { id: 'in-progress', title: 'In Progress', color: 'border-blue-600' },
    { id: 'review', title: 'Review', color: 'border-yellow-600' },
    { id: 'done', title: 'Done', color: 'border-green-600' },
  ];

  const priorityColors = {
    low: 'bg-gray-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
  };

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group tasks by status
  const tasksByStatus = columns.reduce(
    (acc, column) => {
      acc[column.id] = filteredTasks.filter(
        (task) => task.status === column.id
      );
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();

    if (!draggedTask) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${draggedTask.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === draggedTask.id
            ? { ...task, status: newStatus as Task['status'] }
            : task
        )
      );
    } catch (err) {
      console.error('Error updating task:', err);
      // Show error notification
      showNotification('Failed to update task status', 'error');
    }

    setDraggedTask(null);
  };

  const showNotification = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
    };

    notification.classList.add(colors[type]);
    notification.innerHTML = `
      <div class="flex items-center space-x-3 text-white">
        <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      className="bg-slate-800 rounded-lg p-4 mb-3 cursor-move hover:bg-slate-700 transition-colors border border-slate-700"
      onClick={() => openTaskDetails(task)}
    >
      {/* Priority indicator */}
      <div
        className={`w-1 h-full absolute left-0 top-0 rounded-l-lg ${priorityColors[task.priority]}`}
      />

      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-medium text-sm pr-2">{task.title}</h3>
        <span
          className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status]}`}
        >
          {task.status.replace('-', ' ')}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task metadata */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <div className="flex items-center space-x-1">
              <img
                src={
                  task.assignee.profilePicture ||
                  `https://ui-avatars.com/api/?name=${task.assignee.name}&background=3b82f6&color=fff`
                }
                alt={task.assignee.name}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-xs text-gray-400">
                {task.assignee.name}
              </span>
            </div>
          )}
        </div>
        {task.dueAt && (
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <i className="fas fa-calendar"></i>
            <span>{new Date(task.dueAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="px-2 py-1 bg-slate-700 text-xs text-gray-300 rounded"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="px-2 py-1 bg-slate-700 text-xs text-gray-400 rounded">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Task stats */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-3">
          {task._count?.subtasks && task._count.subtasks > 0 && (
            <div className="flex items-center space-x-1">
              <i className="fas fa-tasks"></i>
              <span>{task._count.subtasks}</span>
            </div>
          )}
          {task._count?.comments && task._count.comments > 0 && (
            <div className="flex items-center space-x-1">
              <i className="fas fa-comment"></i>
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>
        {task.estimatedHours && (
          <div className="flex items-center space-x-1">
            <i className="fas fa-clock"></i>
            <span>{task.estimatedHours}h</span>
            {task.actualHours && (
              <span className="text-blue-400">({task.actualHours}h)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSave = (updatedTask: Partial<Task>) => {
    if (selectedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id ? { ...task, ...updatedTask } : task
        )
      );
    }
  };

  const openNewTaskModal = () => {
    // This would open a modal to create a new task
    console.log('Opening new task modal');
    // TODO: Implement new task modal
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Error loading tasks</div>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="task-board">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">Task Board</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <button
          onClick={openNewTaskModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div
              className={`flex items-center justify-between p-3 rounded-t-lg border-l-4 ${column.color} bg-slate-800`}
            >
              <h3 className="text-white font-medium">{column.title}</h3>
              <span className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                {tasksByStatus[column.id]?.length || 0}
              </span>
            </div>

            {/* Task Cards */}
            <div
              className={`flex-1 p-3 bg-slate-800/50 rounded-b-lg min-h-[400px] border-l-4 ${column.color} border-t-0`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {tasksByStatus[column.id]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No tasks in {column.title.toLowerCase()}
                </div>
              ) : (
                tasksByStatus[column.id].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Total Tasks</div>
          <div className="text-2xl font-bold text-white">
            {filteredTasks.length}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-400">
            {tasksByStatus['in-progress']?.length || 0}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Review</div>
          <div className="text-2xl font-bold text-yellow-400">
            {tasksByStatus['review']?.length || 0}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-400">
            {tasksByStatus['done']?.length || 0}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
        projectId={projectId}
      />
    </div>
  );
};

export default TaskBoard;
