// Task Management - Vanilla JavaScript Implementation
class TaskManager {
  constructor(projectId, containerId) {
    this.projectId = projectId;
    this.containerId = containerId;
    this.tasks = [];
    this.loading = false;
    this.error = null;
  }

  async init() {
    await this.loadTasks();
    this.render();
  }

  async loadTasks() {
    try {
      this.loading = true;
      this.render();

      // Mock data for now - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.tasks = [
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
          projectId: this.projectId,
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
          projectId: this.projectId,
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
          projectId: this.projectId,
        },
      ];

      this.error = null;
    } catch (err) {
      this.error = 'Failed to load tasks';
      console.error('Error loading tasks:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async createTask(taskData) {
    try {
      // Mock API call
      const newTask = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        priority: taskData.priority || 'medium',
        assigneeId: taskData.assigneeId,
        dueDate: taskData.dueDate,
        labels: taskData.labels || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: this.projectId,
      };

      this.tasks.push(newTask);
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to create task';
      console.error('Error creating task:', err);
      this.render();
    }
  }

  async updateTask(id, updates) {
    try {
      const taskIndex = this.tasks.findIndex((task) => task.id === id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = {
          ...this.tasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.render();
        this.dispatchUpdateEvent();
      }
    } catch (err) {
      this.error = 'Failed to update task';
      console.error('Error updating task:', err);
      this.render();
    }
  }

  async deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      this.tasks = this.tasks.filter((task) => task.id !== id);
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to delete task';
      console.error('Error deleting task:', err);
      this.render();
    }
  }

  dispatchUpdateEvent() {
    const event = new CustomEvent('projectStatsUpdate');
    document.dispatchEvent(event);
  }

  getPriorityColor(priority) {
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
  }

  getTasksByStatus(status) {
    return this.tasks.filter((task) => task.status === status);
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

  isOverdue(dueDate, status) {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  }

  showCreateModal() {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Create Task</h3>
        </div>
        <form id="task-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter task title">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter task description"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" name="dueDate" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Labels (comma-separated)</label>
            <input type="text" name="labels" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="design, frontend, urgent">
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const labels = formData.get('labels')
        ? formData
            .get('labels')
            .split(',')
            .map((label) => label.trim())
            .filter((label) => label)
        : [];

      const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate'),
        labels,
      };

      await this.createTask(taskData);
      modal.remove();
    });
  }

  renderTaskCard(task) {
    return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-gray-900 text-sm flex-1 mr-2">${task.title}</h4>
          <div class="flex space-x-1">
            <button onclick="window.taskManager.showEditModal('${task.id}')" class="text-gray-400 hover:text-indigo-600" title="Edit task">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onclick="window.taskManager.deleteTask('${task.id}')" class="text-gray-400 hover:text-red-600" title="Delete task">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        ${task.description ? `<p class="text-gray-600 text-xs mb-3 line-clamp-2">${task.description}</p>` : ''}

        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${this.getPriorityColor(task.priority)}">
            ${task.priority}
          </span>
          ${
            task.dueDate
              ? `
            <span class="text-xs ${this.isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : 'text-gray-500'}">
              ${this.formatDate(task.dueDate)}
              ${this.isOverdue(task.dueDate, task.status) ? ' (Overdue)' : ''}
            </span>
          `
              : ''
          }
        </div>

        ${
          task.labels.length > 0
            ? `
          <div class="flex flex-wrap gap-1 mb-3">
            ${task.labels
              .map(
                (label) => `
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                ${label}
              </span>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        ${
          task.assigneeId
            ? `
          <div class="flex items-center">
            <div class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
              <span class="text-white text-xs font-medium">${task.assigneeId.charAt(0).toUpperCase()}</span>
            </div>
            <span class="ml-2 text-xs text-gray-600">Assigned</span>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.loading) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-500">Loading tasks...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500 mb-4">${this.error}</div>
          <button onclick="window.taskManager.loadTasks()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Try Again</button>
        </div>
      `;
      return;
    }

    const columns = [
      { id: 'todo', title: 'To Do', color: 'gray' },
      { id: 'in-progress', title: 'In Progress', color: 'blue' },
      { id: 'review', title: 'Review', color: 'yellow' },
      { id: 'completed', title: 'Completed', color: 'green' },
    ];

    container.innerHTML = `
      <div class="h-full">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-medium text-gray-900">Task Board</h3>
          <button onclick="window.taskManager.showCreateModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Task</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          ${columns
            .map(
              (column) => `
            <div class="flex flex-col h-full">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-medium text-gray-900">${column.title}</h4>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${column.color}-100 text-${column.color}-800">
                  ${this.getTasksByStatus(column.id).length}
                </span>
              </div>

              <div class="flex-1 bg-gray-50 rounded-lg p-4 min-h-96">
                <div class="space-y-3">
                  ${this.getTasksByStatus(column.id)
                    .map((task) => this.renderTaskCard(task))
                    .join('')}
                  
                  ${
                    this.getTasksByStatus(column.id).length === 0
                      ? `
                    <div class="text-center py-8 text-gray-400">
                      <div class="text-sm">No tasks in ${column.title.toLowerCase()}</div>
                    </div>
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
    `;
  }
}

// Export for use in Astro pages
window.TaskManager = TaskManager;
