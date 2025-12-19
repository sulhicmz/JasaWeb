import React, { useState } from 'react';
import { getApiUrl } from '../../config/api';

interface Milestone {
  id: string;
  title: string;
  dueAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface MilestoneManagerProps {
  projectId: string;
  milestones: Milestone[];
  onMilestoneUpdate: () => void;
}

const MilestoneManager: React.FC<MilestoneManagerProps> = ({
  projectId,
  milestones,
  onMilestoneUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: '',
    dueAt: '',
  });

  const openModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        dueAt: milestone.dueAt || '',
      });
    } else {
      setEditingMilestone(null);
      setFormData({ title: '', dueAt: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMilestone(null);
    setFormData({ title: '', dueAt: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const url = editingMilestone
        ? `${getApiUrl()}/milestones/${editingMilestone.id}`
        : `${getApiUrl()}/milestones`;

      const method = editingMilestone ? 'PATCH' : 'POST';
      const body = {
        title: formData.title,
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
        ...(editingMilestone ? {} : { projectId }),
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        closeModal();
        onMilestoneUpdate();
      } else {
        throw new Error('Failed to save milestone');
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('Failed to save milestone');
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onMilestoneUpdate();
      } else {
        throw new Error('Failed to delete milestone');
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Failed to delete milestone');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueAt?: string, status?: string) => {
    return dueAt && new Date(dueAt) < new Date() && status !== 'completed';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Milestones</h2>
          <button
            onClick={() => openModal()}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add Milestone
          </button>
        </div>
      </div>

      <div className="p-6">
        {milestones.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="mt-2 text-gray-500">No milestones yet</p>
            <button
              onClick={() => openModal()}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create First Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {milestone.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        Due:{' '}
                        {milestone.dueAt
                          ? new Date(milestone.dueAt).toLocaleDateString()
                          : 'No due date'}
                      </span>
                      {isOverdue(milestone.dueAt, milestone.status) && (
                        <span className="text-red-600 font-medium text-sm">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        milestone.status
                      )}`}
                    >
                      {milestone.status}
                    </span>
                    <button
                      onClick={() => openModal(milestone)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(milestone.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueAt}
                    onChange={(e) =>
                      setFormData({ ...formData, dueAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
                  >
                    {editingMilestone ? 'Update' : 'Add'} Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneManager;
