// Gantt Chart component for project timeline visualization
interface Project {
  id: string;
  name: string;
  startAt: Date;
  dueAt: Date;
  status: string;
  progress: number;
  milestones: Milestone[];
  dependencies?: string[];
  assignee?: string;
  priority?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueAt: Date;
  status: string;
  completedAt?: Date;
  projectId: string;
}

class GanttChartManager {
  private container: HTMLElement;
  private projects: Project[] = [];
  private currentZoom: number = 1;
  private currentView: 'gantt' | 'calendar' = 'gantt';
  private timeRange: number = 90; // days
  private filter: string = 'all';

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
    this.initializeChart();
    this.setupEventListeners();
  }

  private initializeChart() {
    this.container.innerHTML = `
      <div class="gantt-container">
        <!-- Chart Header -->
        <div class="gantt-header flex items-center justify-between p-4 bg-slate-800 rounded-t-lg">
          <div class="flex items-center space-x-4">
            <div class="text-white font-medium">Timeline</div>
            <div id="currentDateRange" class="text-sm text-slate-400"></div>
          </div>
          <div class="flex items-center space-x-2">
            <button class="p-2 hover:bg-slate-700 rounded transition-colors" onclick="ganttChart.previousPeriod()">
              <i class="fas fa-chevron-left text-white"></i>
            </button>
            <button class="p-2 hover:bg-slate-700 rounded transition-colors" onclick="ganttChart.today()">
              <i class="fas fa-calendar-day text-white"></i>
            </button>
            <button class="p-2 hover:bg-slate-700 rounded transition-colors" onclick="ganttChart.nextPeriod()">
              <i class="fas fa-chevron-right text-white"></i>
            </button>
          </div>
        </div>

        <!-- Chart Content -->
        <div class="gantt-content bg-slate-900 rounded-b-lg overflow-hidden">
          <!-- Timeline Header -->
          <div id="timelineHeader" class="flex border-b border-slate-700"></div>
          
          <!-- Projects Grid -->
          <div id="projectsGrid" class="max-h-96 overflow-y-auto"></div>
        </div>

        <!-- Legend -->
        <div class="gantt-legend flex items-center justify-center space-x-6 p-4 bg-slate-800 rounded-lg mt-4">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-blue-500 rounded"></div>
            <span class="text-sm text-slate-300">Active</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-green-500 rounded"></div>
            <span class="text-sm text-slate-300">Completed</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-yellow-500 rounded"></div>
            <span class="text-sm text-slate-300">On Hold</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-red-500 rounded"></div>
            <span class="text-sm text-slate-300">Overdue</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span class="text-sm text-slate-300">Milestone</span>
          </div>
        </div>
      </div>
    `;

    this.updateDateRange();
    this.loadProjects();
  }

  private setupEventListeners() {
    // Listen for filter changes
    window.addEventListener('filter-projects', (event: any) => {
      this.filter = event.detail.filter;
      this.renderProjects();
    });

    // Listen for time range changes
    window.addEventListener('update-time-range', (event: any) => {
      this.timeRange = parseInt(event.detail.days);
      this.updateDateRange();
      this.renderProjects();
    });

    // Listen for zoom changes
    window.addEventListener('zoom-chart', (event: any) => {
      this.currentZoom = event.detail.zoom;
      this.renderProjects();
    });

    // Listen for view toggle
    window.addEventListener('toggle-chart-view', (event: any) => {
      this.currentView = event.detail.view;
      this.renderProjects();
    });

    // Listen for milestone rescheduling
    window.addEventListener('reschedule-milestone', (event: any) => {
      this.handleMilestoneReschedule(event.detail);
    });
  }

  private async loadProjects() {
    try {
      const response = await fetch('/api/dashboard/projects-overview');
      const projects = await response.json();

      // Transform data to Gantt format
      this.projects = projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        startAt: new Date(project.startAt || project.createdAt),
        dueAt: new Date(project.dueAt),
        status: project.status,
        progress: project.progress,
        milestones: [], // Will be loaded separately
        assignee: 'Unassigned', // Will be updated with real data
        priority: 'medium',
      }));

      // Load milestones for each project
      await this.loadMilestones();

      this.renderProjects();

      // Emit data update event
      window.dispatchEvent(
        new CustomEvent('projects-data-updated', {
          detail: { projects: this.projects },
        })
      );
    } catch (error) {
      console.error('Failed to load projects:', error);
      this.renderEmptyState();
    }
  }

  private async loadMilestones() {
    try {
      const response = await fetch('/api/dashboard/milestones');
      const milestones = await response.json();

      // Group milestones by project
      milestones.forEach((milestone: any) => {
        const project = this.projects.find((p) => p.id === milestone.projectId);
        if (project) {
          project.milestones.push({
            id: milestone.id,
            title: milestone.title,
            dueAt: new Date(milestone.dueAt),
            status: milestone.status,
            completedAt: milestone.completedAt
              ? new Date(milestone.completedAt)
              : undefined,
            projectId: milestone.projectId,
          });
        }
      });
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  }

  private renderProjects() {
    const filteredProjects = this.getFilteredProjects();
    const timelineHeader = document.getElementById('timelineHeader');
    const projectsGrid = document.getElementById('projectsGrid');

    if (!timelineHeader || !projectsGrid) return;

    // Render timeline header
    this.renderTimelineHeader(timelineHeader);

    // Render projects
    projectsGrid.innerHTML = '';

    if (filteredProjects.length === 0) {
      this.renderEmptyState(projectsGrid);
      return;
    }

    filteredProjects.forEach((project) => {
      const projectRow = this.createProjectRow(project);
      projectsGrid.appendChild(projectRow);
    });
  }

  private renderTimelineHeader(container: HTMLElement) {
    container.innerHTML = '';

    // Project name column
    const nameColumn = document.createElement('div');
    nameColumn.className =
      'w-64 p-3 bg-slate-800 text-white font-medium border-r border-slate-700';
    nameColumn.textContent = 'Project';
    container.appendChild(nameColumn);

    // Date columns
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + this.timeRange);

    const dayWidth = 40 * this.currentZoom;

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayColumn = document.createElement('div');
      dayColumn.className =
        'p-2 text-center text-xs text-slate-400 border-r border-slate-700';
      dayColumn.style.width = `${dayWidth}px`;
      dayColumn.style.minWidth = `${dayWidth}px`;

      // Highlight weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        dayColumn.classList.add('bg-slate-800/50');
      }

      // Highlight today
      if (this.isToday(date)) {
        dayColumn.classList.add('bg-blue-500/20', 'text-blue-300');
      }

      dayColumn.textContent = date.getDate();
      dayColumn.setAttribute('data-date', date.toISOString().split('T')[0]);
      dayColumn.classList.add('drop-zone');

      container.appendChild(dayColumn);
    }
  }

  private createProjectRow(project: Project): HTMLElement {
    const row = document.createElement('div');
    row.className =
      'flex border-b border-slate-800 hover:bg-slate-800/30 transition-colors';

    // Project name cell
    const nameCell = document.createElement('div');
    nameCell.className = 'w-64 p-3 bg-slate-800/50 border-r border-slate-700';
    nameCell.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full ${this.getStatusColor(project.status)}"></div>
        <div class="flex-1">
          <div class="text-white font-medium text-sm">${project.name}</div>
          <div class="text-slate-400 text-xs">${project.progress}% complete</div>
        </div>
      </div>
    `;
    row.appendChild(nameCell);

    // Timeline cells
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + this.timeRange);

    const dayWidth = 40 * this.currentZoom;

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayCell = document.createElement('div');
      dayCell.className = 'p-1 border-r border-slate-700 relative';
      dayCell.style.width = `${dayWidth}px`;
      dayCell.style.minWidth = `${dayWidth}px`;

      // Highlight weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        dayCell.classList.add('bg-slate-800/30');
      }

      // Add project bar if this date is within project timeline
      if (this.isDateInRange(date, project.startAt, project.dueAt)) {
        const bar = this.createProjectBar(project, date, dayWidth);
        dayCell.appendChild(bar);
      }

      // Add milestone indicator
      const milestone = project.milestones.find((m) =>
        this.isSameDay(date, m.dueAt)
      );
      if (milestone) {
        const indicator = this.createMilestoneIndicator(milestone);
        dayCell.appendChild(indicator);
      }

      row.appendChild(dayCell);
    }

    return row;
  }

  private createProjectBar(
    project: Project,
    date: Date,
    dayWidth: number
  ): HTMLElement {
    const bar = document.createElement('div');
    bar.className = `absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-6 rounded ${this.getStatusBarClass(project.status)} cursor-pointer transition-all hover:opacity-80`;
    bar.style.height = '6px';
    bar.style.marginTop = '12px';

    // Add progress indicator
    if (project.progress > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'h-full bg-green-500 rounded-l';
      progressBar.style.width = `${project.progress}%`;
      bar.appendChild(progressBar);
    }

    // Add tooltip
    bar.setAttribute(
      'data-tooltip',
      `${project.name}: ${project.progress}% complete`
    );

    // Add click handler
    bar.addEventListener('click', () => {
      this.showProjectDetails(project);
    });

    return bar;
  }

  private createMilestoneIndicator(milestone: Milestone): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = `absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full ${this.getMilestoneStatusColor(milestone.status)} cursor-pointer draggable-milestone`;
    indicator.style.marginTop = '-6px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.draggable = true;

    indicator.setAttribute(
      'data-tooltip',
      `${milestone.title} - ${milestone.status}`
    );
    indicator.setAttribute('data-milestone-id', milestone.id);

    // Add click handler
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showMilestoneDetails(milestone);
    });

    return indicator;
  }

  private getFilteredProjects(): Project[] {
    if (this.filter === 'all') return this.projects;

    return this.projects.filter((project) => {
      switch (this.filter) {
        case 'active':
          return (
            project.status === 'active' || project.status === 'in-progress'
          );
        case 'completed':
          return project.status === 'completed';
        case 'on-hold':
          return project.status === 'on-hold';
        default:
          return true;
      }
    });
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'active':
      case 'in-progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'on-hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  }

  private getStatusBarClass(status: string): string {
    switch (status) {
      case 'active':
      case 'in-progress':
        return 'bg-blue-500/80';
      case 'completed':
        return 'bg-green-500/80';
      case 'on-hold':
        return 'bg-yellow-500/80';
      default:
        return 'bg-gray-500/80';
    }
  }

  private getMilestoneStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-purple-500';
    }
  }

  private isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  private updateDateRange() {
    const rangeElement = document.getElementById('currentDateRange');
    if (rangeElement) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.timeRange);

      rangeElement.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
  }

  private renderEmptyState(container?: HTMLElement) {
    const target = container || document.getElementById('projectsGrid');
    if (!target) return;

    target.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <i class="fas fa-project-diagram text-4xl text-slate-600 mb-4"></i>
        <h3 class="text-lg font-medium text-slate-400 mb-2">No projects found</h3>
        <p class="text-slate-500">Try adjusting your filters or create a new project to get started.</p>
      </div>
    `;
  }

  private showProjectDetails(project: Project) {
    // Emit event to show project modal or navigate to project page
    window.dispatchEvent(
      new CustomEvent('show-project-details', {
        detail: { project },
      })
    );
  }

  private showMilestoneDetails(milestone: Milestone) {
    // Emit event to show milestone modal
    window.dispatchEvent(
      new CustomEvent('show-milestone-details', {
        detail: { milestone },
      })
    );
  }

  private handleMilestoneReschedule(data: {
    milestoneData: string;
    newDate: string;
  }) {
    // Handle milestone rescheduling
    console.log('Rescheduling milestone:', data);

    // Show confirmation
    if (confirm('Are you sure you want to reschedule this milestone?')) {
      // Update milestone date via API
      this.updateMilestoneDate(data.milestoneData, data.newDate);
    }
  }

  private async updateMilestoneDate(milestoneId: string, newDate: string) {
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dueAt: newDate,
        }),
      });

      if (response.ok) {
        // Reload projects to reflect changes
        this.loadProjects();

        // Show success notification
        this.showNotification('Milestone rescheduled successfully', 'success');
      } else {
        throw new Error('Failed to update milestone');
      }
    } catch (error) {
      console.error('Failed to reschedule milestone:', error);
      this.showNotification('Failed to reschedule milestone', 'error');
    }
  }

  private showNotification(message: string, type: 'success' | 'error') {
    // Emit notification event
    window.dispatchEvent(
      new CustomEvent('show-notification', {
        detail: { message, type },
      })
    );
  }

  // Public methods for navigation
  previousPeriod() {
    // Navigate to previous time period
    console.log('Previous period');
  }

  today() {
    // Navigate to today
    console.log('Today');
  }

  nextPeriod() {
    // Navigate to next time period
    console.log('Next period');
  }
}

// Initialize Gantt chart when DOM is ready
declare global {
  interface Window {
    ganttChart: GanttChartManager;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ganttContainer = document.getElementById('ganttChartContainer');
  if (ganttContainer) {
    window.ganttChart = new GanttChartManager('ganttChartContainer');
  }
});

export default GanttChartManager;
