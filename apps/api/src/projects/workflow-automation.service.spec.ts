import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowAutomationService } from './workflow-automation.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

describe('WorkflowAutomationService', () => {
  let service: WorkflowAutomationService;
  let prisma: jest.Mocked<MultiTenantPrismaService>;

  const mockPrisma = {
    workflowRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    milestone: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    approval: {
      create: jest.fn(),
    },
    task: {
      create: jest.fn(),
    },
    projectTemplate: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowAutomationService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WorkflowAutomationService>(WorkflowAutomationService);
    prisma = module.get(MultiTenantPrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkflowRule', () => {
    it('should create a workflow rule successfully', async () => {
      const createDto = {
        name: 'Test Rule',
        description: 'Test Description',
        trigger: 'project_created',
        condition: { projectStatus: 'draft' },
        action: 'send_notification',
        parameters: { message: 'Test notification' },
        isActive: true,
      };

      const expectedResult = {
        id: 'rule-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.workflowRule.create.mockResolvedValue(expectedResult);

      const result = await service.createWorkflowRule(createDto);

      expect(mockPrisma.workflowRule.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          isActive: true,
        },
      });

      expect(result).toEqual(expectedResult);
    });

    it('should create a workflow rule with default isActive', async () => {
      const createDto = {
        name: 'Test Rule',
        trigger: 'project_created',
        action: 'send_notification',
      };

      const expectedResult = {
        id: 'rule-1',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.workflowRule.create.mockResolvedValue(expectedResult);

      const result = await service.createWorkflowRule(createDto);

      expect(mockPrisma.workflowRule.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          isActive: true,
        },
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllWorkflowRules', () => {
    it('should return all active workflow rules', async () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'Rule 1',
          trigger: 'project_created',
          isActive: true,
        },
        {
          id: 'rule-2',
          name: 'Rule 2',
          trigger: 'milestone_completed',
          isActive: true,
        },
      ];

      mockPrisma.workflowRule.findMany.mockResolvedValue(rules);

      const result = await service.findAllWorkflowRules();

      expect(mockPrisma.workflowRule.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toEqual(rules);
    });
  });

  describe('processProjectCreation', () => {
    it('should process project creation trigger', async () => {
      const projectId = 'project-1';
      const template = {
        id: 'template-1',
        serviceType: 'school-website',
      };

      const rules = [
        {
          id: 'rule-1',
          name: 'Test Rule',
          trigger: 'project_created',
          condition: null,
          action: 'send_notification',
          parameters: { message: 'Project created' },
        },
      ];

      mockPrisma.workflowRule.findMany.mockResolvedValue(rules);

      await service.processProjectCreation(projectId, template);

      expect(mockPrisma.workflowRule.findMany).toHaveBeenCalledWith({
        where: {
          trigger: 'project_created',
          isActive: true,
        },
      });
    });
  });

  describe('processMilestoneStatusChange', () => {
    it('should process milestone status change trigger', async () => {
      const milestoneId = 'milestone-1';
      const projectId = 'project-1';
      const oldStatus = 'todo';
      const newStatus = 'completed';

      const rules = [
        {
          id: 'rule-1',
          name: 'Approval Rule',
          trigger: 'milestone_status_changed',
          condition: { newStatus: 'completed' },
          action: 'create_approval',
          parameters: { itemType: 'milestone' },
        },
      ];

      mockPrisma.workflowRule.findMany.mockResolvedValue(rules);
      mockPrisma.approval.create.mockResolvedValue({ id: 'approval-1' });

      await service.processMilestoneStatusChange(
        milestoneId,
        projectId,
        oldStatus,
        newStatus
      );

      expect(mockPrisma.workflowRule.findMany).toHaveBeenCalledWith({
        where: {
          trigger: 'milestone_status_changed',
          isActive: true,
        },
      });

      expect(mockPrisma.approval.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          itemType: 'milestone',
          itemId: 'milestone-1',
          status: 'pending',
          note: 'Auto-generated approval request',
        },
      });
    });
  });

  describe('evaluateCondition', () => {
    it('should return true for null condition', async () => {
      const context = { projectId: 'project-1' };

      const result = await service['evaluateCondition'](null, context);

      expect(result).toBe(true);
    });

    it('should evaluate project status condition', async () => {
      const condition = { projectStatus: 'progress' };
      const context = { projectId: 'project-1' };

      const project = {
        id: 'project-1',
        status: 'progress',
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      const result = await service['evaluateCondition'](condition, context);

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false when project status does not match', async () => {
      const condition = { projectStatus: 'progress' };
      const context = { projectId: 'project-1' };

      const project = {
        id: 'project-1',
        status: 'draft',
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      const result = await service['evaluateCondition'](condition, context);

      expect(result).toBe(false);
    });
  });

  describe('executeAction', () => {
    it('should execute create_approval action', async () => {
      const action = 'create_approval';
      const parameters = { itemType: 'milestone', note: 'Test approval' };
      const context = { projectId: 'project-1', milestoneId: 'milestone-1' };

      mockPrisma.approval.create.mockResolvedValue({ id: 'approval-1' });

      await service['executeAction'](action, parameters, context);

      expect(mockPrisma.approval.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          itemType: 'milestone',
          itemId: 'milestone-1',
          status: 'pending',
          note: 'Test approval',
        },
      });
    });

    it('should execute create_task action', async () => {
      const action = 'create_task';
      const parameters = { title: 'New Task', durationDays: 3 };
      const context = { projectId: 'project-1' };

      mockPrisma.task.create.mockResolvedValue({ id: 'task-1' });

      await service['executeAction'](action, parameters, context);

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          title: 'New Task',
          status: 'todo',
          dueAt: expect.any(Date),
          labels: '',
        },
      });
    });

    it('should execute update_status action for project', async () => {
      const action = 'update_status';
      const parameters = { target: 'project', status: 'review' };
      const context = { projectId: 'project-1' };

      mockPrisma.project.update.mockResolvedValue({
        id: 'project-1',
        status: 'review',
      });

      await service['executeAction'](action, parameters, context);

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: { status: 'review' },
      });
    });

    it('should log warning for unknown action', async () => {
      const action = 'unknown_action';
      const parameters = {};
      const context = { projectId: 'project-1' };

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service['executeAction'](action, parameters, context);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Unknown workflow action: unknown_action'
      );
    });
  });

  describe('setupDefaultWorkflowRules', () => {
    it('should create default workflow rules if they do not exist', async () => {
      mockPrisma.workflowRule.findFirst.mockResolvedValue(null);
      mockPrisma.workflowRule.create.mockResolvedValue({ id: 'rule-1' });

      await service.setupDefaultWorkflowRules();

      expect(mockPrisma.workflowRule.create).toHaveBeenCalledTimes(4);
    });

    it('should not create rules if they already exist', async () => {
      mockPrisma.workflowRule.findFirst.mockResolvedValue({
        id: 'existing-rule',
      });

      await service.setupDefaultWorkflowRules();

      expect(mockPrisma.workflowRule.create).not.toHaveBeenCalled();
    });
  });

  describe('getWorkflowExecutionStats', () => {
    it('should return workflow execution statistics', async () => {
      const rules = [
        {
          name: 'Rule 1',
          trigger: 'project_created',
          action: 'send_notification',
        },
        { name: 'Rule 2', trigger: 'project_created', action: 'create_task' },
        {
          name: 'Rule 3',
          trigger: 'milestone_completed',
          action: 'create_approval',
        },
      ];

      mockPrisma.workflowRule.findMany.mockResolvedValue(rules);

      const result = await service.getWorkflowExecutionStats();

      expect(result).toEqual({
        totalActiveRules: 3,
        rulesByTrigger: {
          project_created: 2,
          milestone_completed: 1,
        },
        rulesByAction: {
          send_notification: 1,
          create_task: 1,
          create_approval: 1,
        },
      });
    });
  });
});
