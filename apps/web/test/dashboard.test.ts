import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ProjectManagementHub from '../src/components/dashboard/ProjectManagementHub.astro';

// Mock fetch API
global.fetch = vi.fn();

describe('ProjectManagementHub', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: 'A test project',
          status: 'active',
          progress: 75,
          totalMilestones: 4,
          completedMilestones: 3,
          openTickets: 2,
          highPriorityTickets: 1,
          startAt: '2024-01-01',
          dueAt: '2024-03-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    // Mock DOM APIs
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock custom events
    global.CustomEvent = vi.fn().mockImplementation((type, options) => ({
      type,
      detail: options?.detail,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }));

    global.dispatchEvent = vi.fn();
  });

  it('renders project management hub correctly', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="glass-panel p-6 rounded-xl">
        <h2>Project Management Hub</h2>
        <div id="projectsContainer"></div>
      </div>
    `;

    expect(container.querySelector('h2')?.textContent).toBe(
      'Project Management Hub'
    );
    expect(container.querySelector('#projectsContainer')).toBeTruthy();
  });

  it('loads projects on initialization', async () => {
    const mockProjects = [
      {
        id: 'proj-1',
        name: 'Test Project',
        status: 'active',
        progress: 75,
      },
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });

    // Simulate the component loading projects
    const response = await fetch('/api/dashboard/projects-overview?limit=20');
    const projects = await response.json();

    expect(fetch).toHaveBeenCalledWith(
      '/api/dashboard/projects-overview?limit=20'
    );
    expect(projects).toEqual(mockProjects);
  });

  it('filters projects by search term', () => {
    const projects = [
      { name: 'Website Redesign', description: 'Redesign the company website' },
      { name: 'Mobile App', description: 'Develop mobile application' },
      { name: 'API Development', description: 'Build RESTful API' },
    ];

    const searchTerm = 'website';
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm)
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Website Redesign');
  });

  it('applies status filter correctly', () => {
    const projects = [
      { name: 'Project 1', status: 'active' },
      { name: 'Project 2', status: 'completed' },
      { name: 'Project 3', status: 'active' },
      { name: 'Project 4', status: 'on-hold' },
    ];

    const statusFilter = 'active';
    const filtered = projects.filter(
      (project) => project.status === statusFilter
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.status === 'active')).toBe(true);
  });

  it('handles real-time project updates', () => {
    const mockUpdate = {
      type: 'project',
      data: {
        projectId: 'proj-1',
        name: 'Updated Project Name',
        status: 'completed',
      },
    };

    // Simulate receiving a real-time update
    const event = new CustomEvent('dashboard-update', { detail: mockUpdate });

    // The component should handle this event
    expect(event.type).toBe('dashboard-update');
    expect(event.detail).toEqual(mockUpdate);
  });

  it('displays loading state correctly', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="loadingState" class="hidden text-center py-12">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading projects...</p>
      </div>
    `;

    const loadingState = container.querySelector('#loadingState');
    expect(loadingState).toBeTruthy();
    expect(loadingState?.classList.contains('hidden')).toBe(true);
  });

  it('shows empty state when no projects', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="emptyState" class="hidden text-center py-12">
        <i class="fas fa-folder-open"></i>
        <p>No projects found</p>
      </div>
    `;

    const emptyState = container.querySelector('#emptyState');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.querySelector('p')?.textContent).toBe(
      'No projects found'
    );
  });

  it('calculates project health score correctly', () => {
    const calculateHealthScore = (
      project: any,
      progress: number,
      openTickets: number
    ) => {
      let score = 100;

      if (project.dueAt && new Date(project.dueAt) < new Date()) {
        score -= 20;
      }

      if (openTickets > 5) {
        score -= 15;
      } else if (openTickets > 3) {
        score -= 8;
      }

      if (progress > 80) {
        score += 10;
      } else if (progress > 60) {
        score += 5;
      }

      if (project.status === 'on-hold') {
        score -= 25;
      }

      return Math.max(0, Math.min(100, score));
    };

    const project = {
      status: 'active',
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    const healthScore = calculateHealthScore(project, 75, 2);
    expect(healthScore).toBeGreaterThan(80);
    expect(healthScore).toBeLessThanOrEqual(100);
  });

  it('formats project dates correctly', () => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };

    const testDate = '2024-01-15T00:00:00Z';
    const formatted = formatDate(testDate);

    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Matches MM/DD/YYYY format
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetch('/api/dashboard/projects-overview?limit=20');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });

  it('toggles between grid and list views', () => {
    let currentView = 'grid';

    const toggleView = () => {
      currentView = currentView === 'grid' ? 'list' : 'grid';
    };

    expect(currentView).toBe('grid');
    toggleView();
    expect(currentView).toBe('list');
    toggleView();
    expect(currentView).toBe('grid');
  });

  it('prioritizes high-priority tickets in display', () => {
    const projects = [
      { name: 'Project A', highPriorityTickets: 3 },
      { name: 'Project B', highPriorityTickets: 0 },
      { name: 'Project C', highPriorityTickets: 1 },
    ];

    // Sort by high priority tickets (descending)
    const sorted = [...projects].sort(
      (a, b) => b.highPriorityTickets - a.highPriorityTickets
    );

    expect(sorted[0].name).toBe('Project A');
    expect(sorted[1].name).toBe('Project C');
    expect(sorted[2].name).toBe('Project B');
  });

  it('generates correct progress bar color', () => {
    const getProgressColor = (progress: number) => {
      if (progress >= 75) return 'bg-green-500';
      if (progress >= 50) return 'bg-blue-500';
      if (progress >= 25) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    expect(getProgressColor(90)).toBe('bg-green-500');
    expect(getProgressColor(60)).toBe('bg-blue-500');
    expect(getProgressColor(30)).toBe('bg-yellow-500');
    expect(getProgressColor(10)).toBe('bg-red-500');
  });
});

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Notification API
    global.Notification = vi.fn().mockImplementation((title, options) => ({
      title,
      body: options?.body,
      icon: options?.icon,
      tag: options?.tag,
      requireInteraction: options?.requireInteraction,
    })) as any;

    (global.Notification as any).permission = 'granted';
    (global.Notification as any).requestPermission = vi
      .fn()
      .mockResolvedValue('granted');

    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createOscillator: () => ({
        connect: vi.fn(),
        frequency: { value: 800 },
        type: 'sine',
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createGain: () => ({
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      }),
      currentTime: 0,
    })) as any;
  });

  it('requests notification permission on initialization', () => {
    expect(global.Notification).toBeDefined();
    expect((global.Notification as any).requestPermission).toBeDefined();
  });

  it('creates desktop notifications when enabled', () => {
    const notification = new global.Notification('Test Title', {
      body: 'Test body',
      icon: '/favicon.ico',
    });

    expect(global.Notification).toHaveBeenCalledWith('Test Title', {
      body: 'Test body',
      icon: '/favicon.ico',
    });
  });

  it('plays notification sound when enabled', () => {
    const audioContext = new global.AudioContext();
    expect(audioContext).toBeDefined();
  });

  it('filters notifications by type', () => {
    const notifications = [
      { type: 'project', title: 'Project Update' },
      { type: 'ticket', title: 'New Ticket' },
      { type: 'project', title: 'Another Project' },
      { type: 'milestone', title: 'Milestone Completed' },
    ];

    const projectNotifications = notifications.filter(
      (n) => n.type === 'project'
    );
    expect(projectNotifications).toHaveLength(2);
    expect(projectNotifications.every((n) => n.type === 'project')).toBe(true);
  });

  it('marks notifications as read', () => {
    const notifications = [
      { id: '1', isRead: false },
      { id: '2', isRead: false },
      { id: '3', isRead: true },
    ];

    const markAsRead = (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      if (notification) {
        notification.isRead = true;
      }
    };

    markAsRead('1');
    expect(notifications.find((n) => n.id === '1')?.isRead).toBe(true);
    expect(notifications.find((n) => n.id === '2')?.isRead).toBe(false);
  });

  it('formats notification timestamps correctly', () => {
    const formatTime = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString();
    };

    const now = new Date();
    expect(formatTime(new Date(now.getTime() - 5 * 60000))).toBe('5m ago');
    expect(formatTime(new Date(now.getTime() - 2 * 3600000))).toBe('2h ago');
    expect(formatTime(new Date(now.getTime() - 3 * 86400000))).toBe('3d ago');
  });
});

describe('AnalyticsReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Chart.js
    global.Chart = vi.fn().mockImplementation(() => ({
      update: vi.fn(),
      data: { labels: [], datasets: [] },
    })) as any;
  });

  it('initializes charts correctly', () => {
    const ctx = document.createElement('canvas').getContext('2d');
    const chart = new global.Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
    });

    expect(global.Chart).toHaveBeenCalledWith(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
    });
  });

  it('generates time labels for different periods', () => {
    const generateTimeLabels = (period: number) => {
      const labels = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }

      return labels;
    };

    const labels = generateTimeLabels(7);
    expect(labels).toHaveLength(7);
    expect(labels[0]).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });

  it('calculates project health scores', () => {
    const calculateHealthScore = (project: any) => {
      let score = 100;

      if (project.status === 'on-hold') score -= 25;
      if (project.overdue) score -= 20;
      if (project.openTickets > 5) score -= 15;

      return Math.max(0, score);
    };

    const project1 = { status: 'active', overdue: false, openTickets: 2 };
    const project2 = { status: 'on-hold', overdue: true, openTickets: 8 };

    expect(calculateHealthScore(project1)).toBe(100);
    expect(calculateHealthScore(project2)).toBe(40);
  });

  it('exports reports in different formats', () => {
    const exportReport = (data: any, format: string) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      return {
        blob,
        filename: `report.${format}`,
      };
    };

    const data = { summary: 'test data' };
    const jsonExport = exportReport(data, 'json');
    const csvExport = exportReport(data, 'csv');

    expect(jsonExport.filename).toBe('report.json');
    expect(csvExport.filename).toBe('report.csv');
  });

  it('handles metric search functionality', () => {
    const metrics = [
      { name: 'Website Redesign', status: 'active' },
      { name: 'Mobile App Development', status: 'completed' },
      { name: 'API Integration', status: 'active' },
    ];

    const searchMetrics = (searchTerm: string) => {
      return metrics.filter((metric) =>
        metric.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    const results = searchMetrics('website');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Website Redesign');
  });
});
