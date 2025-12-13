import React, { useState, useEffect } from 'react';

interface Approval {
  id: string;
  itemType: string;
  itemId: string;
  status: string;
  decidedById?: string;
  decidedBy?: {
    id: string;
    name: string;
    email: string;
  };
  decidedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalManagerProps {
  projectId: string;
  approvals: Approval[];
  onApprovalUpdate: () => void;
}

const ApprovalManager: React.FC<ApprovalManagerProps> = ({
  projectId,
  approvals,
  onApprovalUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewingApproval, setReviewingApproval] = useState<Approval | null>(
    null
  );
  const [formData, setFormData] = useState({
    itemType: 'page',
    itemId: '',
    note: '',
  });
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    note: '',
  });

  const openModal = (approval?: Approval) => {
    if (approval) {
      setReviewingApproval(approval);
      setReviewData({
        status: approval.status === 'pending' ? 'approved' : approval.status,
        note: approval.note || '',
      });
    } else {
      setReviewingApproval(null);
      setFormData({ itemType: 'page', itemId: '', note: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setReviewingApproval(null);
    setFormData({ itemType: 'page', itemId: '', note: '' });
    setReviewData({ status: 'approved', note: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/approvals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId,
        }),
      });

      if (response.ok) {
        closeModal();
        onApprovalUpdate();
      } else {
        throw new Error('Failed to create approval request');
      }
    } catch (error) {
      console.error('Error creating approval request:', error);
      alert('Failed to create approval request');
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewingApproval) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:3001/approvals/${reviewingApproval.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (response.ok) {
        closeModal();
        onApprovalUpdate();
      } else {
        throw new Error('Failed to update approval');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType?.toLowerCase()) {
      case 'page':
        return 'Page';
      case 'content':
        return 'Content';
      case 'design':
        return 'Design';
      case 'feature':
        return 'Feature';
      case 'milestone':
        return 'Milestone';
      default:
        return itemType;
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const completedApprovals = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Approvals</h2>
          <button
            onClick={() => openModal()}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Request Approval
          </button>
        </div>
      </div>

      <div className="p-6">
        {approvals.length === 0 ? (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-gray-500">No approval requests yet</p>
            <button
              onClick={() => openModal()}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Request First Approval
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Pending Review ({pendingApprovals.length})
                </h3>
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getItemTypeLabel(approval.itemType)} -{' '}
                            {approval.itemId}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Requested on{' '}
                            {new Date(approval.createdAt).toLocaleDateString()}
                          </p>
                          {approval.note && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              Note: {approval.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              approval.status
                            )}`}
                          >
                            {approval.status}
                          </span>
                          <button
                            onClick={() => openModal(approval)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Approvals */}
            {completedApprovals.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Completed ({completedApprovals.length})
                </h3>
                <div className="space-y-3">
                  {completedApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getItemTypeLabel(approval.itemType)} -{' '}
                            {approval.itemId}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Requested on{' '}
                            {new Date(approval.createdAt).toLocaleDateString()}
                          </p>
                          {approval.note && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              Request note: {approval.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              approval.status
                            )}`}
                          >
                            {approval.status}
                          </span>
                        </div>
                      </div>

                      {approval.decidedBy && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Reviewed by:</span>{' '}
                              {approval.decidedBy.name}
                              {approval.decidedAt && (
                                <span className="ml-2">
                                  on{' '}
                                  {new Date(
                                    approval.decidedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {approval.decidedAt && approval.note && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              Review note: {approval.note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reviewingApproval
                  ? 'Review Approval Request'
                  : 'Request Approval'}
              </h3>

              {reviewingApproval ? (
                <form onSubmit={handleReview}>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Reviewing: {getItemTypeLabel(reviewingApproval.itemType)}{' '}
                      - {reviewingApproval.itemId}
                    </p>
                    {reviewingApproval.note && (
                      <div className="mb-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>Request note:</strong> {reviewingApproval.note}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <select
                      value={reviewData.status}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Note (optional)
                    </label>
                    <textarea
                      value={reviewData.note}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, note: e.target.value })
                      }
                      rows={3}
                      placeholder="Add your review comments..."
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
                      className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                        reviewData.status === 'approved'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {reviewData.status === 'approved' ? 'Approve' : 'Reject'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Type
                    </label>
                    <select
                      value={formData.itemType}
                      onChange={(e) =>
                        setFormData({ ...formData, itemType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="page">Page</option>
                      <option value="content">Content</option>
                      <option value="design">Design</option>
                      <option value="feature">Feature</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item ID/Name
                    </label>
                    <input
                      type="text"
                      value={formData.itemId}
                      onChange={(e) =>
                        setFormData({ ...formData, itemId: e.target.value })
                      }
                      required
                      placeholder="e.g., Homepage, Login Form, User Dashboard"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (optional)
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                      rows={3}
                      placeholder="Add any context or specific requirements..."
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
                      Request Approval
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalManager;
