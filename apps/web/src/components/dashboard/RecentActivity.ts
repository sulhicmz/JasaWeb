// Recent Activity Component
interface RecentActivity {
  id: string;
  type: 'project' | 'ticket' | 'milestone' | 'invoice';
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  priority?: string;
  dueDate?: Date;
}

class RecentActivityComponent extends HTMLElement {
  private activities: RecentActivity[] = [];
  private loading = false;
  private error: string | null = null;

  connectedCallback() {
    this.render();
    this.fetchActivities();

    // Listen for refresh events
    window.addEventListener('refresh-dashboard', () => {
      this.fetchActivities();
    });
  }

  async fetchActivities() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const response = await fetch('/api/dashboard/recent-activity?limit=10');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.activities = await response.json();
    } catch (err) {
      this.error =
        err instanceof Error ? err.message : 'Failed to fetch activities';
      console.error('Error fetching recent activities:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  getActivityIcon(type: string): string {
    const icons = {
      project: 'fas fa-project-diagram text-blue-400',
      ticket: 'fas fa-ticket-alt text-green-400',
      milestone: 'fas fa-flag-checkered text-yellow-400',
      invoice: 'fas fa-file-invoice-dollar text-purple-400',
    };
    return icons[type as keyof typeof icons] || 'fas fa-circle text-gray-400';
  }

  getStatusColor(status: string): string {
    const colors = {
      active: 'text-green-400',
      'in-progress': 'text-blue-400',
      completed: 'text-green-400',
      open: 'text-yellow-400',
      closed: 'text-gray-400',
      issued: 'text-blue-400',
      paid: 'text-green-400',
      overdue: 'text-red-400',
      draft: 'text-gray-400',
    };
    return colors[status as keyof typeof colors] || 'text-gray-400';
  }

  getPriorityColor(priority?: string): string {
    const colors = {
      low: 'text-gray-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400',
    };
    return colors[priority as keyof typeof colors] || '';
  }

  formatDate(dateString: string | Date): string {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  render() {
    if (this.loading) {
      this.innerHTML = `
        <div class="glass-panel p-6 rounded-xl">
          <h2 class="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div class="space-y-4">
            ${Array.from(
              { length: 5 },
              () => `
              <div class="flex items-start space-x-3 animate-pulse">
                <div class="w-10 h-10 bg-slate-700 rounded-lg flex-shrink-0"></div>
                <div class="flex-1">
                  <div class="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
                  <div class="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            `
            ).join('')}
          </div>
        </div>
      `;
      return;
    }

    if (this.error) {
      this.innerHTML = `
        <div class="glass-panel p-6 rounded-xl border border-red-500/20">
          <h2 class="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div class="flex items-center space-x-3 text-red-400">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Failed to load recent activities. Please try again.</span>
          </div>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="glass-panel p-6 rounded-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white">Recent Activity</h2>
          <button class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
        
        ${
          this.activities.length === 0
            ? `
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-inbox text-4xl mb-4 opacity-50"></i>
            <p>No recent activity</p>
          </div>
        `
            : `
          <div class="space-y-4">
            ${this.activities
              .map(
                (activity) => `
              <div class="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-800/40 transition-colors duration-200">
                <div class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-white font-medium truncate">${activity.title}</h3>
                      <p class="text-gray-400 text-sm mt-1">${activity.description}</p>
                      
                      <div class="flex items-center space-x-3 mt-2 text-xs">
                        <span class="${this.getStatusColor(activity.status)}">
                          ${activity.status}
                        </span>
                        ${
                          activity.priority
                            ? `
                          <span class="${this.getPriorityColor(activity.priority)}">
                            <i class="fas fa-flag"></i> ${activity.priority}
                          </span>
                        `
                            : ''
                        }
                        ${
                          activity.dueDate
                            ? `
                          <span class="text-gray-400">
                            <i class="fas fa-calendar"></i> ${new Date(activity.dueDate).toLocaleDateString()}
                          </span>
                        `
                            : ''
                        }
                      </div>
                    </div>
                    
                    <div class="text-xs text-gray-400 ml-4 flex-shrink-0">
                      ${this.formatDate(activity.createdAt)}
                    </div>
                  </div>
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

customElements.define('recent-activity', RecentActivityComponent);
