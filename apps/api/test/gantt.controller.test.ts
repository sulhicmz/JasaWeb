import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GanttController } from '../gantt.controller';
import { MultiTenantPrismaService } from '../../common/database/multi-tenant-prisma.service';

describe('GanttController', () => {
  let ganttController: GanttController;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      project: {
        findMany: vi.fn(),
      },
    };

    ganttController = new GanttController(mockPrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getGanttTasks', () => {
    const mockOrganizationId = 'org-123';
    const mockProjects = [
      {
        id: 'proj-1',
        name: 'Company Website',
        status: 'in-progress',
        createdAt: new Date('2024-01-01'),
        dueAt: new Date('2024-03-01'),
        milestones: [
          {
            id: 'milestone-1',
            title: 'Discovery Phase',
            status: 'completed',
            priority: 'high',
            dueAt: new Date('2024-01-15'),
            createdAt: new Date('2024-01-01'),
            assignedTo: 'user-1',
            dependencies: [],
          },
          {
            id: 'milestone-2',
            title: 'Design Phase',
            status: 'in-progress',
            priority: 'critical',
            dueAt: new Date('2024-02-15'),
            createdAt: new Date('2024-01-16'),
            assignedTo: 'user-2',
            dependencies: [{ dependentOnId: 'milestone-1' }],
          },
        ],
        tickets: [
          {
            id: 'ticket-1',
            type: 'task',
            subject: 'Implement homepage',
            status: 'in-progress',
            priority: 'high',
            dueAt: new Date('2024-02-01'),
            createdAt: new Date('2024-01-20'),
            assignedTo: 'user-3',
          },
        ],
        _count: {
          milestones: 2,
          tickets: 1,
        },
      },
    ];

    it('should return Gantt tasks for organization', async () => {
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await ganttController.getGanttTasks(mockOrganizationId);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        include: {
          milestones: {
            include: {
              dependencies: true,
            },
            orderBy: {
              dueAt: 'asc',
            },
          },
          tickets: {
            where: {
              type: 'task',
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              milestones: true,
              tickets: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      expect(result).toHaveLength(6); // 2 milestones + 1 ticket + 3 deliverables
      expect(result[0]).toMatchObject({
        id: 'milestone-milestone-1',
        title: 'Discovery Phase',
        type: 'milestone',
        status: 'completed',
        progress: 100,
        priority: 'high',
        projectId: 'proj-1',
        projectName: 'Company Website',
      });
    });

    it('should filter by project ID', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([mockProjects[0]]);

      await ganttController.getGanttTasks(mockOrganizationId, 'proj-1');

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrganizationId, projectId: 'proj-1' },
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await ganttController.getGanttTasks(
        mockOrganizationId,
        undefined,
        'completed'
      );

      expect(result).toHaveLength(2); // Only completed milestone + deliverable
      expect(result.every((task) => task.status === 'completed')).toBe(true);
    });

    it('should filter by priority', async () => {
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await ganttController.getGanttTasks(
        mockOrganizationId,
        undefined,
        undefined,
        'critical'
      );

      expect(result.every((task) => task.priority === 'critical')).toBe(true);
    });

    it('should mark overdue tasks correctly', async () => {
      const overdueProject = {
        ...mockProjects[0],
        milestones: [
          {
            ...mockProjects[0].milestones[0],
            status: 'in-progress',
            dueAt: new Date('2024-01-01'), // Past date
          },
        ],
      };
      mockPrismaService.project.findMany.mockResolvedValue([overdueProject]);

      const result = await ganttController.getGanttTasks(mockOrganizationId);

      const overdueTask = result.find(
        (task) => task.id === 'milestone-milestone-1'
      );
      expect(overdueTask?.status).toBe('overdue');
    });

    it('should calculate progress correctly based on status', async () => {
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await ganttController.getGanttTasks(mockOrganizationId);

      const completedMilestone = result.find(
        (task) => task.id === 'milestone-milestone-1'
      );
      const inProgressMilestone = result.find(
        (task) => task.id === 'milestone-milestone-2'
      );

      expect(completedMilestone?.progress).toBe(100);
      expect(inProgressMilestone?.progress).toBe(50);
    });

    it('should handle empty projects list', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const result = await ganttController.getGanttTasks(mockOrganizationId);

      expect(result).toHaveLength(0);
    });

    it('should handle projects without milestones', async () => {
      const projectWithoutMilestones = {
        ...mockProjects[0],
        milestones: [],
        tickets: [],
        _count: { milestones: 0, tickets: 0 },
      };
      mockPrismaService.project.findMany.mockResolvedValue([
        projectWithoutMilestones,
      ]);

      const result = await ganttController.getGanttTasks(mockOrganizationId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getGanttSummary', () => {
    const mockOrganizationId = 'org-123';
    const mockTasks = [
      {
        status: 'completed',
        priority: 'critical',
        type: 'milestone',
        progress: 100,
      },
      { status: 'in-progress', priority: 'high', type: 'task', progress: 60 },
      {
        status: 'pending',
        priority: 'medium',
        type: 'deliverable',
        progress: 20,
      },
      { status: 'overdue', priority: 'low', type: 'milestone', progress: 30 },
    ];

    beforeEach(() => {
      vi.spyOn(ganttController, 'getGanttTasks').mockResolvedValue(
        mockTasks as any
      );
    });

    it('should return comprehensive summary', async () => {
      const result = await ganttController.getGanttSummary(mockOrganizationId);

      expect(result).toMatchObject({
        totalTasks: 4,
        tasksByStatus: {
          pending: 1,
          inProgress: 1,
          completed: 1,
          overdue: 1,
        },
        tasksByPriority: {
          critical: 1,
          high: 1,
          medium: 1,
          low: 1,
        },
        tasksByType: {
          milestone: 2,
          task: 1,
          deliverable: 1,
        },
        averageProgress: 52, // (100 + 60 + 20 + 30) / 4
      });
    });

    it('should calculate upcoming deadlines correctly', async () => {
      const tasksWithDeadlines = [
        ...mockTasks,
        {
          status: 'pending',
          priority: 'high',
          type: 'task',
          progress: 0,
          id: 'task-1',
          title: 'Urgent Task',
          projectName: 'Test Project',
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // 3 days from now
        },
        {
          status: 'pending',
          priority: 'medium',
          type: 'task',
          progress: 0,
          id: 'task-2',
          title: 'Future Task',
          projectName: 'Test Project',
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // 10 days from now
        },
      ];
      vi.spyOn(ganttController, 'getGanttTasks').mockResolvedValue(
        tasksWithDeadlines as any
      );

      const result = await ganttController.getGanttSummary(mockOrganizationId);

      expect(result.upcomingDeadlines).toHaveLength(1);
      expect(result.upcomingDeadlines[0].title).toBe('Urgent Task');
    });

    it('should handle empty tasks list', async () => {
      vi.spyOn(ganttController, 'getGanttTasks').mockResolvedValue([]);

      const result = await ganttController.getGanttSummary(mockOrganizationId);

      expect(result.totalTasks).toBe(0);
      expect(result.averageProgress).toBe(0);
      expect(result.upcomingDeadlines).toHaveLength(0);
    });
  });

  describe('generateProjectDeliverables', () => {
    it('should generate deliverables for active projects', () => {
      const mockProject = {
        id: 'proj-1',
        name: 'Test Project',
        status: 'in-progress',
        createdAt: new Date('2024-01-01'),
        dueAt: new Date('2024-03-01'),
        _count: { milestones: 2 },
      };

      // Access private method through prototype
      const deliverables = (ganttController as any).generateProjectDeliverables(
        mockProject
      );

      expect(deliverables).toHaveLength(3);
      expect(deliverables[0]).toMatchObject({
        title: 'Design Assets & Mockups',
        type: 'deliverable',
        priority: 'high',
        projectId: 'proj-1',
        projectName: 'Test Project',
      });
    });

    it('should not generate deliverables for projects without milestones', () => {
      const mockProject = {
        id: 'proj-1',
        name: 'Test Project',
        status: 'planning',
        createdAt: new Date('2024-01-01'),
        dueAt: new Date('2024-03-01'),
        _count: { milestones: 0 },
      };

      const deliverables = (ganttController as any).generateProjectDeliverables(
        mockProject
      );

      expect(deliverables).toHaveLength(0);
    });

    it('should adjust progress based on project status', () => {
      const completedProject = {
        id: 'proj-1',
        name: 'Test Project',
        status: 'completed',
        createdAt: new Date('2024-01-01'),
        dueAt: new Date('2024-03-01'),
        _count: { milestones: 2 },
      };

      const deliverables = (ganttController as any).generateProjectDeliverables(
        completedProject
      );

      expect(
        deliverables.every(
          (d) => d.progress === 100 && d.status === 'completed'
        )
      ).toBe(true);
    });
  });
});
