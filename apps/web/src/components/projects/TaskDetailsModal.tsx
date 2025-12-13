import React, { useState, useEffect } from 'react';

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
}

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
  dueAt?: string;
}

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => void;
  projectId: string;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  projectId,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        dueAt: task.dueAt
          ? new Date(task.dueAt).toISOString().slice(0, 16)
          : '',
        startAt: task.startAt
          ? new Date(task.startAt).toISOString().slice(0, 16)
          : '',
      });
    }
  }, [task]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchMilestones();
    }
  }, [isOpen, projectId]);

  const fetchUsers = async () => {
    try {
      // Fetch users for the project/organization
      const response = await fetch('/api/users'); // Adjust endpoint as needed
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            dueAt: formData.dueAt
              ? new Date(formData.dueAt).toISOString()
              : null,
            startAt: formData.startAt
              ? new Date(formData.startAt).toISOString()
              : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      onSave(updatedTask);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels?.includes(newLabel.trim())) {
      setFormData((prev) => ({
        ...prev,
        labels: [...(prev.labels || []), newLabel.trim()],
      }));
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels?.filter((label) => label !== labelToRemove) || [],
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'todo'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as Task['status'],
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as Task['priority'],
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignee
                </label>
                <select
                  value={formData.assigneeId || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      assigneeId: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Milestone
                </label>
                <select
                  value={formData.milestoneId || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      milestoneId: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">No Milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startAt || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueAt || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimatedHours || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimatedHours: parseFloat(e.target.value) || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.actualHours || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        actualHours: parseFloat(e.target.value) || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.labels?.map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="text-blue-400 hover:text-blue-200"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addLabel())
                    }
                    placeholder="Add label..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-700 text-gray-300 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addTag())
                    }
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
