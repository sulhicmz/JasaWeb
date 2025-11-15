// Milestone Management - Vanilla JavaScript Implementation
class MilestoneManager {
  constructor(projectId, containerId) {
    this.projectId = projectId;
    this.containerId = containerId;
    this.milestones = [];
    this.loading = false;
    this.error = null;
  }

  async init() {
    await this.loadMilestones();
    this.render();
  }

  async loadMilestones() {
    try {
      this.loading = true;
      this.render();

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:3001/milestones?projectId=${this.projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        this.milestones = await response.json();
        this.error = null;
      } else {
        throw new Error('Failed to load milestones');
      }
    } catch (err) {
      this.error = 'Failed to load milestones';
      console.error('Error loading milestones:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async createMilestone(milestoneData) {
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
          projectId: this.projectId,
          status: 'todo',
        }),
      });

      if (response.ok) {
        await this.loadMilestones();
        this.dispatchUpdateEvent();
      } else {
        throw new Error('Failed to create milestone');
      }
    } catch (err) {
      this.error = 'Failed to create milestone';
      console.error('Error creating milestone:', err);
      this.render();
    }
  }

  async updateMilestone(id, updates) {
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

      if (response.ok) {
        await this.loadMilestones();
        this.dispatchUpdateEvent();
      } else {
        throw new Error('Failed to update milestone');
      }
    } catch (err) {
      this.error = 'Failed to update milestone';
      console.error('Error updating milestone:', err);
      this.render();
    }
  }

  async deleteMilestone(id) {
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

      if (response.ok) {
        await this.loadMilestones();
        this.dispatchUpdateEvent();
      } else {
        throw new Error('Failed to delete milestone');
      }
    } catch (err) {
      this.error = 'Failed to delete milestone';
      console.error('Error deleting milestone:', err);
      this.render();
    }
  }

  dispatchUpdateEvent() {
    const event = new CustomEvent('projectStatsUpdate');
    document.dispatchEvent(event);
  }

  getStatusColor(status) {
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
  }

  getStatusIcon(status) {
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
  }

  isOverdue(dueDate, status) {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
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

  showCreateModal() {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Create Milestone</h3>
        </div>
        <form id="milestone-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter milestone title">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter milestone description"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" name="dueDate" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector('#milestone-form')
      .addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const milestoneData = {
          title: formData.get('title'),
          description: formData.get('description'),
          dueDate: formData.get('dueDate'),
        };

        await this.createMilestone(milestoneData);
        modal.remove();
      });
  }

  showEditModal(milestone) {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Edit Milestone</h3>
        </div>
        <form id="milestone-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" name="title" required value="${milestone.title}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">${milestone.description || ''}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" name="dueDate" value="${milestone.dueDate || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="todo" ${milestone.status === 'todo' ? 'selected' : ''}>Todo</option>
              <option value="in-progress" ${milestone.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${milestone.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="overdue" ${milestone.status === 'overdue' ? 'selected' : ''}>Overdue</option>
            </select>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Update</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector('#milestone-form')
      .addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
          title: formData.get('title'),
          description: formData.get('description'),
          dueDate: formData.get('dueDate'),
          status: formData.get('status'),
        };

        await this.updateMilestone(milestone.id, updates);
        modal.remove();
      });
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.loading) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-500">Loading milestones...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500 mb-4">${this.error}</div>
          <button onclick="window.milestoneManager.loadMilestones()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Try Again</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Project Timeline</h3>
          <button onclick="window.milestoneManager.showCreateModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Milestone</button>
        </div>

        ${
          this.milestones.length === 0
            ? `
          <div class="text-center py-12 bg-white rounded-lg shadow">
            <div class="text-gray-400 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No milestones yet</h3>
            <p class="text-gray-500 mb-4">Create your first milestone to start tracking progress</p>
            <button onclick="window.milestoneManager.showCreateModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Create Milestone</button>
          </div>
        `
            : `
          <div class="relative">
            <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="space-y-6">
              ${this.milestones
                .map(
                  (milestone, index) => `
                <div class="relative flex items-start">
                  <div class="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${this.getStatusColor(milestone.status)} border-2">
                    ${this.getStatusIcon(milestone.status)}
                  </div>
                  <div class="flex-1 ml-6 bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-start mb-4">
                      <div class="flex-1">
                        <h4 class="text-lg font-medium text-gray-900 mb-2">${milestone.title}</h4>
                        ${milestone.description ? `<p class="text-gray-600 mb-3">${milestone.description}</p>` : ''}
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(milestone.status)}">
                            ${milestone.status || 'todo'}
                          </span>
                          ${
                            milestone.dueDate
                              ? `
                            <span class="${this.isOverdue(milestone.dueDate, milestone.status) ? 'text-red-600 font-medium' : ''}">
                              Due: ${this.formatDate(milestone.dueDate)}
                              ${this.isOverdue(milestone.dueDate, milestone.status) ? ' (Overdue)' : ''}
                            </span>
                          `
                              : ''
                          }
                          <span>Created: ${this.formatDate(milestone.createdAt)}</span>
                        </div>
                      </div>
                      <div class="flex space-x-2 ml-4">
                        <button onclick="window.milestoneManager.showEditModal(${JSON.stringify(milestone).replace(/"/g, '&quot;')})" class="text-indigo-600 hover:text-indigo-800" title="Edit milestone">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onclick="window.milestoneManager.deleteMilestone('${milestone.id}')" class="text-red-600 hover:text-red-800" title="Delete milestone">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      ${
                        milestone.status !== 'todo'
                          ? `
                        <button onclick="window.milestoneManager.updateMilestone('${milestone.id}', { status: 'todo' })" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">Mark as Todo</button>
                      `
                          : ''
                      }
                      ${
                        milestone.status !== 'in-progress'
                          ? `
                        <button onclick="window.milestoneManager.updateMilestone('${milestone.id}', { status: 'in-progress' })" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Start Progress</button>
                      `
                          : ''
                      }
                      ${
                        milestone.status !== 'completed'
                          ? `
                        <button onclick="window.milestoneManager.updateMilestone('${milestone.id}', { status: 'completed' })" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Mark Complete</button>
                      `
                          : ''
                      }
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        }
      </div>
    `;
  }
}

// Export for use in Astro pages
window.MilestoneManager = MilestoneManager;
