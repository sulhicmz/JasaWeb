// Approval Workflow - Vanilla JavaScript Implementation
class ApprovalManager {
  constructor(projectId, containerId) {
    this.projectId = projectId;
    this.containerId = containerId;
    this.approvals = [];
    this.loading = false;
    this.error = null;
    this.filter = 'all';
  }

  async init() {
    await this.loadApprovals();
    this.render();
  }

  async loadApprovals() {
    try {
      this.loading = true;
      this.render();

      // Mock data for now - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.approvals = [
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
          projectId: this.projectId,
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
          projectId: this.projectId,
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
          projectId: this.projectId,
        },
      ];

      this.error = null;
    } catch (err) {
      this.error = 'Failed to load approvals';
      console.error('Error loading approvals:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async createApproval(approvalData) {
    try {
      const newApproval = {
        id: Date.now().toString(),
        title: approvalData.title,
        description: approvalData.description,
        status: 'pending',
        requestedBy: 'Current User',
        requestedAt: new Date().toISOString(),
        itemType: approvalData.itemType || 'other',
        itemId: approvalData.itemId || 'item1',
        projectId: this.projectId,
      };

      this.approvals = [newApproval, ...this.approvals];
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to create approval request';
      console.error('Error creating approval:', err);
      this.render();
    }
  }

  async reviewApproval(id, status, reviewNotes) {
    try {
      this.approvals = this.approvals.map((approval) =>
        approval.id === id
          ? {
              ...approval,
              status,
              reviewedBy: 'Current User',
              reviewedAt: new Date().toISOString(),
              reviewNotes,
            }
          : approval
      );
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to review approval';
      console.error('Error reviewing approval:', err);
      this.render();
    }
  }

  async deleteApproval(id) {
    if (!confirm('Are you sure you want to delete this approval request?')) {
      return;
    }

    try {
      this.approvals = this.approvals.filter((approval) => approval.id !== id);
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to delete approval';
      console.error('Error deleting approval:', err);
      this.render();
    }
  }

  dispatchUpdateEvent() {
    const event = new CustomEvent('projectStatsUpdate');
    document.dispatchEvent(event);
  }

  getStatusColor(status) {
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
  }

  getItemTypeIcon(itemType) {
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
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getFilteredApprovals() {
    if (this.filter === 'all') {
      return this.approvals;
    }
    return this.approvals.filter((approval) => approval.status === this.filter);
  }

  showCreateModal() {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Request Approval</h3>
        </div>
        <form id="approval-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="What needs approval?">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Provide details about what needs approval"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select name="itemType" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="design">Design</option>
              <option value="content">Content</option>
              <option value="feature">Feature</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Request Approval</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector('#approval-form')
      .addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const approvalData = {
          title: formData.get('title'),
          description: formData.get('description'),
          itemType: formData.get('itemType'),
        };

        await this.createApproval(approvalData);
        modal.remove();
      });
  }

  showDetailModal(approval) {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="text-2xl">${this.getItemTypeIcon(approval.itemType)}</div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">${approval.title}</h3>
                <p class="text-sm text-gray-500">
                  Requested by ${approval.requestedBy} • ${this.formatDate(approval.requestedAt)}
                </p>
              </div>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-6">
          ${
            approval.description
              ? `
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p class="text-gray-600">${approval.description}</p>
            </div>
          `
              : ''
          }

          ${
            approval.reviewedAt
              ? `
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Review Result</h4>
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    approval.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }">
                    ${approval.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </span>
                  <span class="text-sm text-gray-500">
                    by ${approval.reviewedBy} on ${this.formatDate(approval.reviewedAt)}
                  </span>
                </div>
                ${
                  approval.reviewNotes
                    ? `
                  <div>
                    <h5 class="text-sm font-medium text-gray-700 mb-1">Review Notes:</h5>
                    <p class="text-gray-600">${approval.reviewNotes}</p>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          `
              : `
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Review this Request</h4>
              <textarea id="review-notes" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="4" placeholder="Add your review notes (optional)..."></textarea>
            </div>
            <div class="flex justify-end space-x-3">
              <button onclick="window.approvalManager.reviewApproval('${approval.id}', 'rejected', document.getElementById('review-notes').value); this.closest('.fixed').remove();" class="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50">Reject</button>
              <button onclick="window.approvalManager.reviewApproval('${approval.id}', 'approved', document.getElementById('review-notes').value); this.closest('.fixed').remove();" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Approve</button>
            </div>
          `
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  setFilter(newFilter) {
    this.filter = newFilter;
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.loading) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-500">Loading approvals...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500 mb-4">${this.error}</div>
          <button onclick="window.approvalManager.loadApprovals()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Try Again</button>
        </div>
      `;
      return;
    }

    const filteredApprovals = this.getFilteredApprovals();
    const filterTabs = [
      { key: 'all', label: 'All', count: this.approvals.length },
      {
        key: 'pending',
        label: 'Pending',
        count: this.approvals.filter((a) => a.status === 'pending').length,
      },
      {
        key: 'approved',
        label: 'Approved',
        count: this.approvals.filter((a) => a.status === 'approved').length,
      },
      {
        key: 'rejected',
        label: 'Rejected',
        count: this.approvals.filter((a) => a.status === 'rejected').length,
      },
    ];

    container.innerHTML = `
      <div class="h-full">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-medium text-gray-900">Approval Workflow</h3>
          <button onclick="window.approvalManager.showCreateModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Request Approval</button>
        </div>

        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            ${filterTabs
              .map(
                (tab) => `
              <button
                onclick="window.approvalManager.setFilter('${tab.key}')"
                class="py-2 px-1 border-b-2 font-medium text-sm ${
                  this.filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }"
              >
                ${tab.label} (${tab.count})
              </button>
            `
              )
              .join('')}
          </nav>
        </div>

        ${
          filteredApprovals.length === 0
            ? `
          <div class="text-center py-12 bg-white rounded-lg shadow">
            <div class="text-gray-400 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              ${this.filter === 'all' ? 'No approval requests yet' : `No ${this.filter} approvals`}
            </h3>
            <p class="text-gray-500 mb-4">
              ${
                this.filter === 'all'
                  ? 'Create your first approval request to start the workflow'
                  : `No ${this.filter} approval requests found`
              }
            </p>
            ${
              this.filter === 'all'
                ? `
              <button onclick="window.approvalManager.showCreateModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Request Approval</button>
            `
                : ''
            }
          </div>
        `
            : `
          <div class="space-y-4">
            ${filteredApprovals
              .map(
                (approval) => `
              <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start space-x-3">
                      <div class="text-2xl">${this.getItemTypeIcon(approval.itemType)}</div>
                      <div class="flex-1">
                        <h4 class="text-lg font-medium text-gray-900 mb-1">${approval.title}</h4>
                        ${approval.description ? `<p class="text-gray-600 text-sm mb-2">${approval.description}</p>` : ''}
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Requested by ${approval.requestedBy}</span>
                          <span>•</span>
                          <span>${this.formatDate(approval.requestedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center space-x-2">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(approval.status)}">
                        ${approval.status}
                      </span>
                      
                      <div class="flex space-x-1">
                        <button onclick="window.approvalManager.showDetailModal(${JSON.stringify(approval).replace(/"/g, '&quot;')})" class="text-indigo-600 hover:text-indigo-800" title="View details">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        ${
                          approval.status === 'pending'
                            ? `
                          <button onclick="window.approvalManager.deleteApproval('${approval.id}')" class="text-red-600 hover:text-red-800" title="Delete request">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        `
                            : ''
                        }
                      </div>
                    </div>
                  </div>

                  ${
                    approval.reviewedAt
                      ? `
                    <div class="border-t border-gray-100 pt-4 mt-4">
                      <div class="flex items-center justify-between text-sm">
                        <div>
                          <span class="text-gray-500">Reviewed by </span>
                          <span class="font-medium text-gray-900">${approval.reviewedBy}</span>
                          <span class="text-gray-500"> on ${this.formatDate(approval.reviewedAt)}</span>
                        </div>
                      </div>
                      ${
                        approval.reviewNotes
                          ? `
                        <div class="mt-2 p-3 bg-gray-50 rounded-md">
                          <p class="text-sm text-gray-700">${approval.reviewNotes}</p>
                        </div>
                      `
                          : ''
                      }
                    </div>
                  `
                      : ''
                  }
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
        }
      </div>
    `;
  }
}

// Export for use in Astro pages
window.ApprovalManager = ApprovalManager;
