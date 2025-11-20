import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTemplateService } from './project-template.service';
import { WorkflowAutomationService } from './workflow-automation.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

describe('Project Templates Integration', () => {
  let service: ProjectTemplateService;
  let workflowService: WorkflowAutomationService;
  let prisma: MultiTenantPrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectTemplateService,
        WorkflowAutomationService,
        MultiTenantPrismaService,
      ],
    }).compile();

    service = module.get<ProjectTemplateService>(ProjectTemplateService);
    workflowService = module.get<WorkflowAutomationService>(
      WorkflowAutomationService
    );
    prisma = module.get<MultiTenantPrismaService>(MultiTenantPrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Template Creation and Application', () => {
    it('should create and apply a basic template', async () => {
      // Create a basic template
      const template = await service.createProjectTemplate({
        name: 'Test Template',
        description: 'A test template for integration testing',
        serviceType: 'school-website',
        settings: { test: true },
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('Test Template');
      expect(template.serviceType).toBe('school-website');

      // Add a milestone template
      const milestone = await service.createMilestoneTemplate({
        projectTemplateId: template.id,
        title: 'Test Milestone',
        description: 'A test milestone',
        order: 1,
        durationDays: 5,
      });

      expect(milestone).toBeDefined();
      expect(milestone.title).toBe('Test Milestone');
      expect(milestone.projectTemplateId).toBe(template.id);

      // Add a task template
      const task = await service.createTaskTemplate({
        milestoneTemplateId: milestone.id,
        title: 'Test Task',
        description: 'A test task',
        order: 1,
        assigneeRole: 'developer',
        durationDays: 2,
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.milestoneTemplateId).toBe(milestone.id);

      // Apply template to create a project
      const project = await service.applyTemplateToProject(template.id, {
        name: 'Test Project from Template',
        organizationId: 'test-org-id',
        startAt: new Date(),
      });

      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project from Template');
      expect(project.projectTemplateId).toBe(template.id);
      expect(project.milestones).toHaveLength(1);
      expect(project.milestones[0].tasks).toHaveLength(1);
    });
  });

  describe('Workflow Automation', () => {
    it('should create and execute workflow rules', async () => {
      // Create a workflow rule
      const rule = await workflowService.createWorkflowRule({
        name: 'Test Rule',
        description: 'A test workflow rule',
        trigger: 'project_created',
        condition: null,
        action: 'send_notification',
        parameters: { message: 'Test notification' },
      });

      expect(rule).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.trigger).toBe('project_created');

      // Get all rules
      const rules = await workflowService.findAllWorkflowRules();
      expect(rules).toContainEqual(rule);

      // Get execution stats
      const stats = await workflowService.getWorkflowExecutionStats();
      expect(stats.totalActiveRules).toBeGreaterThan(0);
      expect(stats.rulesByTrigger).toHaveProperty('project_created');
    });
  });

  describe('Template Analytics', () => {
    it('should provide template usage statistics', async () => {
      const stats = await service.getTemplateUsageStats();
      expect(Array.isArray(stats)).toBe(true);

      if (stats.length > 0) {
        const stat = stats[0];
        expect(stat).toHaveProperty('id');
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('serviceType');
        expect(stat).toHaveProperty('projectsCount');
        expect(stat).toHaveProperty('isActive');
      }
    });

    it('should calculate template effectiveness metrics', async () => {
      // First get all templates to find one to test
      const templates = await service.findAllProjectTemplates();

      if (templates.length > 0) {
        const template = templates[0];
        const metrics = await service.getTemplateEffectivenessMetrics(
          template.id
        );

        expect(metrics).toHaveProperty('totalProjects');
        expect(metrics).toHaveProperty('averageCompletionTime');
        expect(metrics).toHaveProperty('onTimeCompletionRate');
        expect(metrics).toHaveProperty('averageTasksPerProject');

        expect(typeof metrics.totalProjects).toBe('number');
        expect(typeof metrics.averageCompletionTime).toBe('number');
        expect(typeof metrics.onTimeCompletionRate).toBe('number');
        expect(typeof metrics.averageTasksPerProject).toBe('number');
      }
    });
  });
});
