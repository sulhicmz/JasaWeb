import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock fetch API
global.fetch = vi.fn();

describe('GanttChart Component', () => {
  let ganttChart: any;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.innerHTML = `
      <div id="timespanSelector"></div>
      <div id="groupBySelector"></div>
      <div id="filterToggle"></div>
      <div id="exportGantt"></div>
      <div id="filterPanel" class="hidden"></div>
      <div id="ganttLoading" class="hidden"></div>
      <div id="timelineHeader"></div>
      <div id="ganttRows"></div>
      <div id="taskModal" class="hidden"></div>
      <div id="modalTaskTitle"></div>
      <div id="modalTaskContent"></div>
      <div id="closeModal"></div>
      <div id="closeModalBtn"></div>
      <div id="editTaskBtn"></div>
    `;
    document.body.appendChild(mockContainer);

    // Mock notification service
    (global.window as any).notificationService = {
      on: vi.fn(),
      getDashboardConnectionStatus: () => ({ connected: true }),
    };

    // Load the GanttChart script
    const script = document.createElement('script');
    script.textContent = `
      class GanttChart {
        constructor() {
          this.tasks = [];
          this.viewOptions = {
            timespan: 'month',
            showWeekends: true,
            groupBy: 'project',
            filterStatus: ['pending', 'in-progress', 'completed', 'overdue']
          };
          this.startDate = new Date();
          this.endDate = new Date();
        }

        async init() {
          this.setupEventListeners();
          await this.loadTasks();
          this.updateDateRange();
          this.render();
        }

        setupEventListeners() {
          // Mock implementation
        }

        async loadTasks() {
          try {
            const response = await fetch('/api/dashboard/gantt-tasks');
            if (response.ok) {
              this.tasks = await response.json();
            } else {
              this.tasks = this.generateMockTasks();
            }
          } catch (error) {
            this.tasks = this.generateMockTasks();
          }
        }

        generateMockTasks() {
          const now = new Date();
          return [
            {
              id: '1',
              title: 'Test Task',
              startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
              progress: 50,
              status: 'in-progress',
              type: 'task',
              priority: 'high',
              projectId: 'proj1',
              projectName: 'Test Project'
            }
          ];
        }

        updateDateRange() {
          const now = new Date();
          this.startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          this.endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        }

        render() {
          this.renderTimelineHeader();
          this.renderTaskRows();
        }

        renderTimelineHeader() {
          const header = document.getElementById('timelineHeader');
          if (!header) return;
          header.innerHTML = '<div class="timeline-day">Test Header</div>';
        }

        renderTaskRows() {
          const container = document.getElementById('ganttRows');
          if (!container) return;
          container.innerHTML = '<div class="task-row">Test Task</div>';
        }

        getFilteredTasks() {
          return this.tasks;
        }

        groupTasks(tasks) {
          return { 'Test Project': tasks };
        }

        createTaskRow(task) {
          const row = document.createElement('div');
          row.className = 'task-row';
          row.textContent = task.title;
          return row;
        }

        showTaskModal(task) {
          const modal = document.getElementById('taskModal');
          const title = document.getElementById('modalTaskTitle');
          if (title && modal) {
            title.textContent = task.title;
            modal.classList.remove('hidden');
          }
        }

        closeTaskModal() {
          document.getElementById('taskModal')?.classList.add('hidden');
        }

        exportChart() {
          // Mock export functionality
        }
      }
    `;
    document.head.appendChild(script);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    delete (global.window as any).notificationService;
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      ganttChart = new (global.window as any).GanttChart();

      expect(ganttChart.viewOptions.timespan).toBe('month');
      expect(ganttChart.viewOptions.groupBy).toBe('project');
      expect(ganttChart.viewOptions.showWeekends).toBe(true);
      expect(ganttChart.tasks).toEqual([]);
    });

    it('should set up event listeners during initialization', async () => {
      ganttChart = new (global.window as any).GanttChart();
      const setupEventListenersSpy = vi.spyOn(
        ganttChart,
        'setupEventListeners'
      );
      const loadTasksSpy = vi.spyOn(ganttChart, 'loadTasks');
      const renderSpy = vi.spyOn(ganttChart, 'render');

      await ganttChart.init();

      expect(setupEventListenersSpy).toHaveBeenCalled();
      expect(loadTasksSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Task Loading', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
    });

    it('should load tasks from API successfully', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'API Task',
          status: 'completed',
          progress: 100,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      await ganttChart.loadTasks();

      expect(ganttChart.tasks).toEqual(mockTasks);
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/gantt-tasks');
    });

    it('should fall back to mock tasks on API failure', async () => {
      const generateMockTasksSpy = vi.spyOn(ganttChart, 'generateMockTasks');
      generateMockTasksSpy.mockReturnValue([
        { id: 'mock', title: 'Mock Task' },
      ]);

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await ganttChart.loadTasks();

      expect(generateMockTasksSpy).toHaveBeenCalled();
      expect(ganttChart.tasks).toEqual([{ id: 'mock', title: 'Mock Task' }]);
    });

    it('should use mock tasks when API response is not ok', async () => {
      const generateMockTasksSpy = vi.spyOn(ganttChart, 'generateMockTasks');
      generateMockTasksSpy.mockReturnValue([
        { id: 'mock', title: 'Mock Task' },
      ]);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await ganttChart.loadTasks();

      expect(generateMockTasksSpy).toHaveBeenCalled();
    });
  });

  describe('Date Range Management', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
    });

    it('should update date range for month view', () => {
      ganttChart.viewOptions.timespan = 'month';
      const now = new Date(2024, 5, 15); // June 15, 2024

      ganttChart.startDate = now;
      ganttChart.updateDateRange();

      expect(ganttChart.startDate.getMonth()).toBe(4); // May
      expect(ganttChart.endDate.getMonth()).toBe(7); // August
    });

    it('should update date range for week view', () => {
      ganttChart.viewOptions.timespan = 'week';
      const now = new Date(2024, 5, 15); // June 15, 2024

      ganttChart.startDate = now;
      ganttChart.updateDateRange();

      const expectedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const expectedEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      expect(ganttChart.startDate.toDateString()).toBe(
        expectedStart.toDateString()
      );
      expect(ganttChart.endDate.toDateString()).toBe(
        expectedEnd.toDateString()
      );
    });

    it('should update date range for quarter view', () => {
      ganttChart.viewOptions.timespan = 'quarter';
      const now = new Date(2024, 5, 15); // June 15, 2024 (Q2)

      ganttChart.startDate = now;
      ganttChart.updateDateRange();

      expect(ganttChart.startDate.getMonth()).toBe(3); // April (start of Q2)
      expect(ganttChart.endDate.getMonth()).toBe(8); // September (end of Q3)
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
      ganttChart.tasks = [
        { id: '1', status: 'completed', priority: 'high' },
        { id: '2', status: 'in-progress', priority: 'low' },
        { id: '3', status: 'pending', priority: 'medium' },
        { id: '4', status: 'overdue', priority: 'critical' },
      ];
    });

    it('should filter tasks by status', () => {
      ganttChart.viewOptions.filterStatus = ['completed', 'in-progress'];
      const filtered = ganttChart.getFilteredTasks();

      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.id)).toEqual(['1', '2']);
    });

    it('should return all tasks when no status filter is applied', () => {
      ganttChart.viewOptions.filterStatus = [
        'pending',
        'in-progress',
        'completed',
        'overdue',
      ];
      const filtered = ganttChart.getFilteredTasks();

      expect(filtered).toHaveLength(4);
    });

    it('should filter by date range', () => {
      const oldDate = new Date('2024-01-01');
      const futureDate = new Date('2024-12-31');

      ganttChart.startDate = new Date('2024-06-01');
      ganttChart.endDate = new Date('2024-06-30');

      // Add tasks with dates
      ganttChart.tasks = [
        {
          id: '1',
          status: 'in-progress',
          startDate: oldDate,
          endDate: oldDate,
        },
        {
          id: '2',
          status: 'in-progress',
          startDate: futureDate,
          endDate: futureDate,
        },
        {
          id: '3',
          status: 'in-progress',
          startDate: new Date('2024-06-15'),
          endDate: new Date('2024-06-20'),
        },
      ];

      const filtered = ganttChart.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('3');
    });
  });

  describe('Task Grouping', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
      ganttChart.tasks = [
        { id: '1', projectName: 'Project A', priority: 'high' },
        { id: '2', projectName: 'Project B', priority: 'low' },
        { id: '3', projectName: 'Project A', priority: 'medium' },
      ];
    });

    it('should group tasks by project', () => {
      ganttChart.viewOptions.groupBy = 'project';
      const grouped = ganttChart.groupTasks(ganttChart.tasks);

      expect(Object.keys(grouped)).toEqual(['Project A', 'Project B']);
      expect(grouped['Project A']).toHaveLength(2);
      expect(grouped['Project B']).toHaveLength(1);
    });

    it('should group tasks by priority', () => {
      ganttChart.viewOptions.groupBy = 'priority';
      const grouped = ganttChart.groupTasks(ganttChart.tasks);

      expect(Object.keys(grouped)).toEqual(['High', 'Low', 'Medium']);
      expect(grouped['High']).toHaveLength(1);
      expect(grouped['Low']).toHaveLength(1);
      expect(grouped['Medium']).toHaveLength(1);
    });

    it('should group tasks by assignee', () => {
      ganttChart.tasks = [
        { id: '1', assignee: 'User A', priority: 'high' },
        { id: '2', assignee: 'User B', priority: 'low' },
        { id: '3', assignee: 'User A', priority: 'medium' },
      ];
      ganttChart.viewOptions.groupBy = 'assignee';
      const grouped = ganttChart.groupTasks(ganttChart.tasks);

      expect(Object.keys(grouped)).toEqual(['User A', 'User B']);
      expect(grouped['User A']).toHaveLength(2);
      expect(grouped['User B']).toHaveLength(1);
    });

    it('should handle unassigned tasks', () => {
      ganttChart.tasks = [
        { id: '1', assignee: 'User A', priority: 'high' },
        { id: '2', priority: 'low' }, // No assignee
      ];
      ganttChart.viewOptions.groupBy = 'assignee';
      const grouped = ganttChart.groupTasks(ganttChart.tasks);

      expect(Object.keys(grouped)).toEqual(['User A', 'Unassigned']);
      expect(grouped['Unassigned']).toHaveLength(1);
    });
  });

  describe('Modal Management', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
    });

    it('should show task modal with correct data', () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        projectName: 'Test Project',
        status: 'in-progress',
        priority: 'high',
        type: 'task',
        progress: 50,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-15'),
      };

      ganttChart.showTaskModal(mockTask);

      const modal = document.getElementById('taskModal');
      const title = document.getElementById('modalTaskTitle');

      expect(modal?.classList.contains('hidden')).toBe(false);
      expect(title?.textContent).toBe('Test Task');
    });

    it('should close task modal', () => {
      const modal = document.getElementById('taskModal');
      modal?.classList.remove('hidden');

      ganttChart.closeTaskModal();

      expect(modal?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
      ganttChart.tasks = [
        {
          id: '1',
          title: 'Test Task',
          projectName: 'Test Project',
          status: 'in-progress',
          priority: 'high',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-15'),
          progress: 50,
        },
      ];

      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock createElement and click
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      global.document.createElement = vi.fn(() => mockLink as any);
    });

    it('should export tasks to CSV', () => {
      ganttChart.exportChart();

      expect(global.document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      ganttChart = new (global.window as any).GanttChart();
    });

    it('should render timeline header', () => {
      ganttChart.renderTimelineHeader();

      const header = document.getElementById('timelineHeader');
      expect(header?.innerHTML).toContain('Test Header');
    });

    it('should render task rows', () => {
      ganttChart.renderTaskRows();

      const rows = document.getElementById('ganttRows');
      expect(rows?.innerHTML).toContain('Test Task');
    });

    it('should create task row element', () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        projectName: 'Test Project',
        status: 'in-progress',
        priority: 'high',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-15'),
        progress: 50,
      };

      const row = ganttChart.createTaskRow(mockTask);

      expect(row.className).toBe('task-row');
      expect(row.textContent).toContain('Test Task');
    });
  });
});
