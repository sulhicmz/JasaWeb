import React, { useState, useEffect } from 'react';

interface Approval {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  itemType: 'design' | 'content' | 'feature' | 'document' | 'other';
  itemId: string;
  projectId: string;
}

interface ApprovalWorkflowProps {
  projectId: string;
  onApprovalUpdate?: () => void;
}

export default function ApprovalWorkflow({
  projectId,
  onApprovalUpdate,
}: ApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');

  useEffect(() => {
    loadApprovals();
  }, [projectId]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockApprovals: Approval[] = [
        {
          id: '1',
          title: 'Homepage Design Approval',
          description:
            'Please review and approve the new homepage design layout',
          status: 'pending',
          requestedBy: 'John Doe',
          requestedAt: '2024-12-10T10:30:00Z',
          itemType: 'design',
          itemId: 'design1',
          projectId,
        },
        {
          id: '2',
          title: 'About Page Content',
          description: 'Review the updated content for the about page',
          status: 'approved',
          requestedBy: 'Jane Smith',
          requestedAt: '2024-12-08T14:15:00Z',
          reviewedBy: 'Project Manager',
          reviewedAt: '2024-12-09T09:30:00Z',
          reviewNotes: 'Looks good! Minor typos fixed.',
          itemType: 'content',
          itemId: 'content1',
          projectId,
        },
        {
          id: '3',
          title: 'Contact Form Feature',
          description: 'New contact form with validation and email integration',
          status: 'rejected',
          requestedBy: 'Mike Johnson',
          requestedAt: '2024-12-05T16:45:00Z',
          reviewedBy: 'Tech Lead',
          reviewedAt: '2024-12-06T11:20:00Z',
          reviewNotes: 'Need to add CAPTCHA before approval.',
          itemType: 'feature',
          itemId: 'feature1',
          projectId,
        },
      ];

      setApprovals(mockApprovals);
      setError(null);
    } catch (err) {
      setError('Failed to load approvals');
      console.error('Error loading approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const createApproval = async (approvalData: Partial<Approval>) => {
    try {
      const newApproval: Approval = {
        id: Date.now().toString(),
        title: approvalData.title || '',
        description: approvalData.description || '',
        status: 'pending',
        requestedBy: 'Current User',
        requestedAt: new Date().toISOString(),
        itemType: approvalData.itemType || 'other',
        itemId: approvalData.itemId || 'item1',
        projectId,
      };

      setApprovals([newApproval, ...approvals]);
      setShowCreateModal(false);
      onApprovalUpdate?.();
    } catch (err) {
      setError('Failed to create approval request');
      console.error('Error creating approval:', err);
    }
  };

  const reviewApproval = async (
    id: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ) => {
    try {
      setApprovals(
        approvals.map((approval) =>
          approval.id === id
            ? {
                ...approval,
                status,
                reviewedBy: 'Current User',
                reviewedAt: new Date().toISOString(),
                reviewNotes,
              }
            : approval
        )
      );
      setSelectedApproval(null);
      onApprovalUpdate?.();
    } catch (err) {
      setError('Failed to review approval');
      console.error('Error reviewing approval:', err);
    }
  };

  const deleteApproval = async (id: string) => {
    if (!confirm('Are you sure you want to delete this approval request?')) {
      return;
    }

    try {
      setApprovals(approvals.filter((approval) => approval.id !== id));
      onApprovalUpdate?.();
    } catch (err) {
      setError('Failed to delete approval');
      console.error('Error deleting approval:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'design':
        return '🎨';
      case 'content':
        return '📝';
      case 'feature':
        return '⚙️';
      case 'document':
        return '📄';
      default:
        return '📋';
    }
  };

  const filteredApprovals = approvals.filter(
    (approval) => filter === 'all' || approval.status === filter
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Loading approvals...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Approval Workflow</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Request Approval
        </button>
      </div>

      {/* Filter Tabs */}
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All', count: approvals.length },
            {
              key: 'pending',
              label: 'Pending',
              count: approvals.filter((a) => a.status === 'pending').length,
            },
            {
              key: 'approved',
              label: 'Approved',
              count: approvals.filter((a) => a.status === 'approved').length,
            },
            {
              key: 'rejected',
              label: 'Rejected',
              count: approvals.filter((a) => a.status === 'rejected').length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all'
              ? 'No approval requests yet'
              : `No ${filter} approvals`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? 'Create your first approval request to start the workflow'
              : `No ${filter} approval requests found`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Request Approval
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onView={() => setSelectedApproval(approval)}
              onDelete={() => deleteApproval(approval.id)}
            />
          ))}
        </div>
      )}

      {/* Create Approval Modal */}
      {showCreateModal && (
        <ApprovalModal
          onSave={createApproval}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onApprove={(notes) =>
            reviewApproval(selectedApproval.id, 'approved', notes)
          }
          onReject={(notes) =>
            reviewApproval(selectedApproval.id, 'rejected', notes)
          }
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </div>
  );
}

interface ApprovalCardProps {
  approval: Approval;
  onView: () => void;
  onDelete: () => void;
}

function ApprovalCard({ approval, onView, onDelete }: ApprovalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'design':
        return '🎨';
      case 'content':
        return '📝';
      case 'feature':
        return '⚙️';
      case 'document':
        return '📄';
      default:
        return '📋';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{getItemTypeIcon(approval.itemType)}</div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900 mb-1">
                {approval.title}
              </h4>
              {approval.description && (
                <p className="text-gray-600 text-sm mb-2">
                  {approval.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Requested by {approval.requestedBy}</span>
                <span>•</span>
                <span>
                  {new Date(approval.requestedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}
            >
              {approval.status}
            </span>

            <div className="flex space-x-1">
              <button
                onClick={onView}
                className="text-indigo-600 hover:text-indigo-800"
                title="View details"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>

              {approval.status === 'pending' && (
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800"
                  title="Delete request"
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
              )}
            </div>
          </div>
        </div>

        {approval.reviewedAt && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Reviewed by </span>
                <span className="font-medium text-gray-900">
                  {approval.reviewedBy}
                </span>
                <span className="text-gray-500">
                  {' '}
                  on {new Date(approval.reviewedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {approval.reviewNotes && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{approval.reviewNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ApprovalModalProps {
  onSave: (data: Partial<Approval>) => void;
  onCancel: () => void;
}

function ApprovalModal({ onSave, onCancel }: ApprovalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    itemType: 'other' as Approval['itemType'],
    itemId: '',
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
            Request Approval
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
              placeholder="What needs approval?"
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
              placeholder="Provide details about what needs approval"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.itemType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  itemType: e.target.value as Approval['itemType'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="design">Design</option>
              <option value="content">Content</option>
              <option value="feature">Feature</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
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
              {loading ? 'Creating...' : 'Request Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ApprovalDetailModalProps {
  approval: Approval;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  onClose: () => void;
}

function ApprovalDetailModal({
  approval,
  onApprove,
  onReject,
  onClose,
}: ApprovalDetailModalProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(reviewNotes);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(reviewNotes);
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'design':
        return '🎨';
      case 'content':
        return '📝';
      case 'feature':
        return '⚙️';
      case 'document':
        return '📄';
      default:
        return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {getItemTypeIcon(approval.itemType)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {approval.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Requested by {approval.requestedBy} •{' '}
                  {new Date(approval.requestedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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

        <div className="p-6">
          {approval.description && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Description
              </h4>
              <p className="text-gray-600">{approval.description}</p>
            </div>
          )}

          {approval.reviewedAt ? (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Review Result
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      approval.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {approval.status === 'approved'
                      ? '✓ Approved'
                      : '✗ Rejected'}
                  </span>
                  <span className="text-sm text-gray-500">
                    by {approval.reviewedBy} on{' '}
                    {new Date(approval.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
                {approval.reviewNotes && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Review Notes:
                    </h5>
                    <p className="text-gray-600">{approval.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Review this Request
              </h4>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Add your review notes (optional)..."
              />
            </div>
          )}

          {!approval.reviewedAt && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
