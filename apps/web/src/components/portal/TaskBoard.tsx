import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

interface TaskBoardProps {
  projectId: string;
  onTaskUpdate?: () => void;
}

export default function TaskBoard({ projectId, onTaskUpdate }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'gray' },
    { id: 'in-progress', title: 'In Progress', color: 'blue' },
    { id: 'review', title: 'Review', color: 'yellow' },
    { id: 'completed', title: 'Completed', color: 'green' },
  ];

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Design homepage layout',
          description: 'Create responsive design for the homepage',
          status: 'in-progress',
          priority: 'high',
          assigneeId: 'user1',
          dueDate: '2024-12-20',
          labels: ['design', 'frontend'],
          createdAt: '2024-12-01T10:00:00Z',
          updatedAt: '2024-12-10T15:30:00Z',
          projectId,
        },
        {
          id: '2',
          title: 'Implement user authentication',
          description: 'Add login and registration functionality',
          status: 'todo',
          priority: 'high',
          assigneeId: 'user2',
          dueDate: '2024-12-25',
          labels: ['backend', 'security'],
          createdAt: '2024-12-02T09:00:00Z',
          updatedAt: '2024-12-02T09:00:00Z',
          projectId,
        },
        {
          id: '3',
          title: 'Setup database schema',
          description: 'Create Prisma schema for all entities',
          status: 'completed',
          priority: 'medium',
          assigneeId: 'user1',
          dueDate: '2024-12-15',
          labels: ['backend', 'database'],
          createdAt: '2024-12-01T08:00:00Z',
          updatedAt: '2024-12-14T16:45:00Z',
          projectId,
        },
      ];

      setTasks(mockTasks);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    try {
      // Mock API call - replace with actual implementation
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title || '',
        description: taskData.description || '',
        status: 'todo',
        priority: taskData.priority || 'medium',
        assigneeId: taskData.assigneeId,
        dueDate: taskData.dueDate,
        labels: taskData.labels || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId,
      };

      setTasks([...tasks, newTask]);
      setShowCreateModal(false);
      onTaskUpdate?.();
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setTasks(
        tasks.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );
      setEditingTask(null);
      onTaskUpdate?.();
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setTasks(tasks.filter((task) => task.id !== id));
      onTaskUpdate?.();
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTask(draggedTask.id, { status: newStatus });
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={loadTasks}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Task Board</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">{column.title}</h4>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${column.color}-100 text-${column.color}-800`}
              >
                {getTasksByStatus(column.id as Task['status']).length}
              </span>
            </div>

            {/* Task List */}
            <div
              className={`flex-1 bg-gray-50 rounded-lg p-4 min-h-400`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id as Task['status'])}
            >
              <div className="space-y-3">
                {getTasksByStatus(column.id as Task['status']).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => deleteTask(task.id)}
                    onDragStart={() => handleDragStart(task)}
                  />
                ))}

                {getTasksByStatus(column.id as Task['status']).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-sm">
                      No tasks in {column.title.toLowerCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onSave={
            editingTask
              ? (data) => updateTask(editingTask.id, data)
              : createTask
          }
          onCancel={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}

function TaskCard({ task, onEdit, onDelete, onDragStart }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1 mr-2">
          {task.title}
        </h4>
        <div className="flex space-x-1">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-indigo-600"
            title="Edit task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600"
            title="Delete task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </span>
        {task.dueDate && (
          <span
            className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}
          >
            {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue(task.dueDate) && ' (Overdue)'}
          </span>
        )}
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {task.assigneeId && (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {task.assigneeId.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="ml-2 text-xs text-gray-600">Assigned</span>
        </div>
      )}
    </div>
  );
}

interface TaskModalProps {
  task?: Task | null;
  onSave: (data: Partial<Task>) => void;
  onCancel: () => void;
}

function TaskModal({ task, onSave, onCancel }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigneeId: task?.assigneeId || '',
    dueDate: task?.dueDate || '',
    labels: task?.labels?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const labels = formData.labels
        .split(',')
        .map((label) => label.trim())
        .filter((label) => label.length > 0);

      await onSave({
        ...formData,
        labels,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {task ? 'Edit Task' : 'Create Task'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Task['status'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Task['priority'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labels (comma-separated)
            </label>
            <input
              type="text"
              value={formData.labels}
              onChange={(e) =>
                setFormData({ ...formData, labels: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="design, frontend, urgent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
