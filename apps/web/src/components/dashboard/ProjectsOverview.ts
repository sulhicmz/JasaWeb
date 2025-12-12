// Projects Overview Component
import { SkeletonLoader } from '../ui/skeleton-loader.js';
import { offlineCache } from '../../services/offline-cache.js';
import { realtimeService } from '../../services/realtime.js';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  openTickets: number;
  highPriorityTickets: number;
  createdAt: string;
  updatedAt: string;
  startAt?: string;
  dueAt?: string;
}

class ProjectsOverviewComponent extends HTMLElement {
  private projects: Project[] = [];
  private loading = false;
  private error: string | null = null;
  private unsubscribeRealtime: (() => void) | null = null;
  private isOnline = navigator.onLine;

  connectedCallback() {
    this.render();
    this.fetchProjects();
    this.setupRealtime();
    this.setupOfflineDetection();

    // Listen for refresh events
    window.addEventListener('refresh-dashboard', () => {
      this.fetchProjects(true);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }
  }

  private setupRealtime() {
    this.unsubscribeRealtime = realtimeService.subscribe(
      'project-update',
      () => {
        this.fetchProjects(true);
      }
    );
  }

  private setupOfflineDetection() {
    window.addEventListener('offline-status-changed', (event: any) => {
      this.isOnline = event.detail.isOnline;
      if (this.isOnline) {
        this.fetchProjects(true);
      }
    });
  }

  async fetchProjects(forceRefresh = false) {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const cacheKey = 'projects-overview';
      const ttl = forceRefresh ? 0 : 5 * 60 * 1000; // 5 minutes

      this.projects = await offlineCache.fetchWithCache<Project[]>(
        '/api/dashboard/projects-overview?limit=6',
        {},
        cacheKey,
        ttl
      );
    } catch (err) {
      this.error =
        err instanceof Error ? err.message : 'Failed to fetch projects';
      console.error('Error fetching projects overview:', err);

      // Try cache as fallback
      if (!this.projects) {
        const cached = offlineCache.get<Project[]>('projects-overview');
        if (cached) {
          this.projects = cached;
        }
      }
    } finally {
      this.loading = false;
      this.render();
    }
  }

  getStatusColor(status: string): { bg: string; text: string } {
    const colors = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400' },
      'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400' },
      'on-hold': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400' },
      planning: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
    };
    return (
      colors[status as keyof typeof colors] || {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
      }
    );
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  render() {
    if (this.loading) {
      this.innerHTML = SkeletonLoader.createProjectsSkeleton();
      return;
    }

    if (this.error) {
      this.innerHTML = `
        <div class="glass-panel p-6 rounded-xl border border-red-500/20">
          <h2 class="text-xl font-bold text-white mb-4">Projects Overview</h2>
          <div class="flex items-center space-x-3 text-red-400">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Failed to load projects. Please try again.</span>
          </div>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="glass-panel p-6 rounded-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white">Projects Overview</h2>
          <button class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
        
        ${
          this.projects.length === 0
            ? `
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-folder-open text-4xl mb-4 opacity-50"></i>
            <p>No projects found</p>
          </div>
        `
            : `
          <div class="space-y-4">
            ${this.projects
              .map((project) => {
                const statusColors = this.getStatusColor(project.status);
                const progressColor = this.getProgressColor(project.progress);
                const isOverdue = this.isOverdue(project.dueAt);

                return `
                <div class="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors duration-200">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-white font-medium truncate">${project.name}</h3>
                      <div class="flex items-center space-x-2 mt-1">
                        <span class="px-2 py-1 ${statusColors.bg} ${statusColors.text} text-xs rounded-full">
                          ${project.status}
                        </span>
                        ${
                          project.dueAt
                            ? `
                          <span class="text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}">
                            <i class="fas fa-calendar"></i> ${this.formatDate(project.dueAt)}
                            ${isOverdue ? ' (Overdue)' : ''}
                          </span>
                        `
                            : ''
                        }
                      </div>
                    </div>
                    <div class="text-lg font-bold text-white ml-4">
                      ${project.progress}%
                    </div>
                  </div>
                  
                  <!-- Progress Bar -->
                  <div class="mb-3">
                    <div class="w-full bg-slate-700 rounded-full h-2">
                      <div class="${progressColor} h-2 rounded-full transition-all duration-300" style="width: ${project.progress}%"></div>
                    </div>
                  </div>
                  
                  <!-- Project Metrics -->
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center space-x-4">
                      <span class="text-gray-400">
                        <i class="fas fa-flag-checkered"></i> 
                        ${project.completedMilestones}/${project.totalMilestones} milestones
                      </span>
                      <span class="${project.openTickets > 0 ? 'text-yellow-400' : 'text-gray-400'}">
                        <i class="fas fa-ticket-alt"></i> 
                        ${project.openTickets} tickets
                      </span>
                    </div>
                    ${
                      project.highPriorityTickets > 0
                        ? `
                      <span class="text-red-400">
                        <i class="fas fa-exclamation-triangle"></i> 
                        ${project.highPriorityTickets} high priority
                      </span>
                    `
                        : ''
                    }
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        `
        }
      </div>
    `;
  }
}

customElements.define('projects-overview', ProjectsOverviewComponent);
