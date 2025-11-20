import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTemplateService } from './project-template.service';
import { WorkflowAutomationService } from './workflow-automation.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

describe('ProjectTemplateService', () => {
  let service: ProjectTemplateService;
  let prisma: jest.Mocked<MultiTenantPrismaService>;
  let workflowAutomation: jest.Mocked<WorkflowAutomationService>;

  const mockPrisma = {
    projectTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    milestoneTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    milestone: {
      create: jest.fn(),
    },
    task: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectTemplateService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrisma,
        },
        {
          provide: WorkflowAutomationService,
          useValue: {
            processProjectCreation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectTemplateService>(ProjectTemplateService);
    prisma = module.get(MultiTenantPrismaService);
    workflowAutomation = module.get(WorkflowAutomationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProjectTemplate', () => {
    it('should create a project template successfully', async () => {
      const createDto = {
        name: 'Test Template',
        description: 'Test Description',
        serviceType: 'school-website' as const,
        settings: { test: 'value' },
      };

      const expectedResult = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test Description',
        serviceType: 'school-website',
        version: '1.0',
        settings: { test: 'value' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        milestoneTemplates: [],
      };

      mockPrisma.projectTemplate.create.mockResolvedValue(expectedResult);

      const result = await service.createProjectTemplate(createDto);

      expect(mockPrisma.projectTemplate.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          version: '1.0',
        },
        include: {
          milestoneTemplates: {
            include: {
              taskTemplates: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllProjectTemplates', () => {
    it('should return all active project templates', async () => {
      const templates = [
        {
          id: 'template-1',
          name: 'Template 1',
          serviceType: 'school-website',
          isActive: true,
          milestoneTemplates: [],
          _count: { projects: 5 },
        },
        {
          id: 'template-2',
          name: 'Template 2',
          serviceType: 'news-portal',
          isActive: true,
          milestoneTemplates: [],
          _count: { projects: 3 },
        },
      ];

      mockPrisma.projectTemplate.findMany.mockResolvedValue(templates);

      const result = await service.findAllProjectTemplates();

      expect(mockPrisma.projectTemplate.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        include: {
          milestoneTemplates: {
            include: {
              taskTemplates: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              projects: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toEqual(templates);
    });
  });

  describe('findProjectTemplateById', () => {
    it('should return a project template by id', async () => {
      const templateId = 'template-1';
      const template = {
        id: templateId,
        name: 'Test Template',
        serviceType: 'school-website',
        isActive: true,
        milestoneTemplates: [],
        _count: { projects: 5 },
      };

      mockPrisma.projectTemplate.findUnique.mockResolvedValue(template);

      const result = await service.findProjectTemplateById(templateId);

      expect(mockPrisma.projectTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: templateId },
        include: {
          milestoneTemplates: {
            include: {
              taskTemplates: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

      expect(result).toEqual(template);
    });

    it('should throw NotFoundException when template not found', async () => {
      const templateId = 'non-existent';

      mockPrisma.projectTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findProjectTemplateById(templateId)).rejects.toThrow(
        `Project template with ID ${templateId} not found`
      );
    });
  });

  describe('applyTemplateToProject', () => {
    it('should apply template to create project with milestones and tasks', async () => {
      const templateId = 'template-1';
      const projectData = {
        name: 'Test Project',
        organizationId: 'org-1',
        startAt: new Date('2024-01-01'),
      };

      const template = {
        id: templateId,
        name: 'Test Template',
        serviceType: 'school-website',
        milestoneTemplates: [
          {
            id: 'milestone-template-1',
            title: 'Milestone 1',
            order: 1,
            durationDays: 5,
            taskTemplates: [
              {
                id: 'task-template-1',
                title: 'Task 1',
                order: 1,
                durationDays: 2,
                assigneeRole: 'developer',
              },
            ],
          },
        ],
      };

      const createdProject = {
        id: 'project-1',
        name: 'Test Project',
        organizationId: 'org-1',
        status: 'draft',
      };

      const finalProject = {
        id: 'project-1',
        name: 'Test Project',
        milestones: [
          {
            id: 'milestone-1',
            title: 'Milestone 1',
            tasks: [
              {
                id: 'task-1',
                title: 'Task 1',
              },
            ],
          },
        ],
        projectTemplate: template,
      };

      mockPrisma.projectTemplate.findUnique.mockResolvedValue(template);
      mockPrisma.project.create.mockResolvedValue(createdProject);
      mockPrisma.milestone.create.mockResolvedValue({ id: 'milestone-1' });
      mockPrisma.task.create.mockResolvedValue({ id: 'task-1' });
      mockPrisma.project.findUnique.mockResolvedValue(finalProject);

      const result = await service.applyTemplateToProject(
        templateId,
        projectData
      );

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...projectData,
          projectTemplateId: templateId,
          status: 'draft',
        },
        include: {
          milestones: true,
          tasks: true,
        },
      });

      expect(workflowAutomation.processProjectCreation).toHaveBeenCalledWith(
        'project-1',
        template
      );

      expect(result).toEqual(finalProject);
    });
  });

  describe('getTemplateUsageStats', () => {
    it('should return template usage statistics', async () => {
      const templates = [
        {
          id: 'template-1',
          name: 'Template 1',
          serviceType: 'school-website',
          isActive: true,
          _count: { projects: 5 },
        },
        {
          id: 'template-2',
          name: 'Template 2',
          serviceType: 'news-portal',
          isActive: true,
          _count: { projects: 3 },
        },
      ];

      mockPrisma.projectTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getTemplateUsageStats();

      expect(result).toEqual([
        {
          id: 'template-1',
          name: 'Template 1',
          serviceType: 'school-website',
          projectsCount: 5,
          isActive: true,
        },
        {
          id: 'template-2',
          name: 'Template 2',
          serviceType: 'news-portal',
          projectsCount: 3,
          isActive: true,
        },
      ]);
    });
  });

  describe('getTemplateEffectivenessMetrics', () => {
    it('should return effectiveness metrics for a template', async () => {
      const templateId = 'template-1';
      const projects = [
        {
          status: 'completed',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-02-01'),
          milestones: [
            { status: 'completed', dueAt: new Date('2024-01-15') },
            { status: 'completed', dueAt: new Date('2024-01-30') },
          ],
          _count: { tasks: 10 },
        },
        {
          status: 'progress',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-15'),
          milestones: [
            { status: 'completed', dueAt: new Date('2024-02-10') },
            { status: 'in-progress', dueAt: new Date('2024-02-20') },
          ],
          _count: { tasks: 8 },
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.getTemplateEffectivenessMetrics(templateId);

      expect(result).toEqual({
        totalProjects: 2,
        averageCompletionTime: 31, // days
        onTimeCompletionRate: 100,
        averageTasksPerProject: 9,
      });
    });

    it('should return zero metrics when no projects exist', async () => {
      const templateId = 'template-1';

      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await service.getTemplateEffectivenessMetrics(templateId);

      expect(result).toEqual({
        totalProjects: 0,
        averageCompletionTime: 0,
        onTimeCompletionRate: 0,
        averageTasksPerProject: 0,
      });
    });
  });
});
