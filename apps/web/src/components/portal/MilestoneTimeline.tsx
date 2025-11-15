import React, { useState, useEffect } from 'react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'overdue';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

interface MilestoneTimelineProps {
  projectId: string;
  onMilestoneUpdate?: () => void;
}

export default function MilestoneTimeline({
  projectId,
  onMilestoneUpdate,
}: MilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:3001/milestones?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load milestones');
      }

      const data = await response.json();
      setMilestones(
        data.sort(
          (a: Milestone, b: Milestone) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
      setError(null);
    } catch (err) {
      setError('Failed to load milestones');
      console.error('Error loading milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMilestone = async (milestoneData: Partial<Milestone>) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/milestones', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...milestoneData,
          projectId,
          status: 'todo',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      await loadMilestones();
      setShowCreateModal(false);
      onMilestoneUpdate?.();
    } catch (err) {
      setError('Failed to create milestone');
      console.error('Error creating milestone:', err);
    }
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/milestones/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      await loadMilestones();
      setEditingMilestone(null);
      onMilestoneUpdate?.();
    } catch (err) {
      setError('Failed to update milestone');
      console.error('Error updating milestone:', err);
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/milestones/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      await loadMilestones();
      onMilestoneUpdate?.();
    } catch (err) {
      setError('Failed to delete milestone');
      console.error('Error deleting milestone:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⏳';
      case 'todo':
        return '○';
      case 'overdue':
        return '!';
      default:
        return '○';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Loading milestones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={loadMilestones}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Milestone Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Project Timeline</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Milestone
        </button>
      </div>

      {/* Timeline */}
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No milestones yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first milestone to start tracking progress
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Milestone
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Milestone Items */}
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex items-start">
                {/* Timeline Dot */}
                <div
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${getStatusColor(milestone.status)} border-2`}
                >
                  {getStatusIcon(milestone.status)}
                </div>

                {/* Milestone Content */}
                <div className="flex-1 ml-6 bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-gray-600 mb-3">
                          {milestone.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}
                        >
                          {milestone.status || 'todo'}
                        </span>
                        {milestone.dueDate && (
                          <span
                            className={
                              isOverdue(milestone.dueDate, milestone.status)
                                ? 'text-red-600 font-medium'
                                : ''
                            }
                          >
                            Due:{' '}
                            {new Date(milestone.dueDate).toLocaleDateString()}
                            {isOverdue(milestone.dueDate, milestone.status) &&
                              ' (Overdue)'}
                          </span>
                        )}
                        <span>
                          Created:{' '}
                          {new Date(milestone.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditingMilestone(milestone)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Edit milestone"
                      >
                        <svg
                          className="w-5 h-5"
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
                        onClick={() => deleteMilestone(milestone.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete milestone"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Quick Status Change */}
                  <div className="flex space-x-2">
                    {milestone.status !== 'todo' && (
                      <button
                        onClick={() =>
                          updateMilestone(milestone.id, { status: 'todo' })
                        }
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        Mark as Todo
                      </button>
                    )}
                    {milestone.status !== 'in-progress' && (
                      <button
                        onClick={() =>
                          updateMilestone(milestone.id, {
                            status: 'in-progress',
                          })
                        }
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Start Progress
                      </button>
                    )}
                    {milestone.status !== 'completed' && (
                      <button
                        onClick={() =>
                          updateMilestone(milestone.id, { status: 'completed' })
                        }
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingMilestone) && (
        <MilestoneModal
          milestone={editingMilestone}
          onSave={
            editingMilestone
              ? (data) => updateMilestone(editingMilestone.id, data)
              : createMilestone
          }
          onCancel={() => {
            setShowCreateModal(false);
            setEditingMilestone(null);
          }}
        />
      )}
    </div>
  );
}

interface MilestoneModalProps {
  milestone?: Milestone | null;
  onSave: (data: Partial<Milestone>) => void;
  onCancel: () => void;
}

function MilestoneModal({ milestone, onSave, onCancel }: MilestoneModalProps) {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    dueDate: milestone?.dueDate || '',
    status: milestone?.status || 'todo',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {milestone ? 'Edit Milestone' : 'Create Milestone'}
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
              placeholder="Enter milestone title"
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
              placeholder="Enter milestone description"
            />
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

          {milestone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Milestone['status'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          )}

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
              {loading ? 'Saving...' : milestone ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
