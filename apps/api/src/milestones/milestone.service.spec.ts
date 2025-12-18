import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneService } from './milestone.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import {
  CreateMilestoneDto,
  MilestoneStatus,
} from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { vi } from 'vitest';

describe('MilestoneService', () => {
  let service: MilestoneService;
  let multiTenantPrisma: MultiTenantPrismaService;

  const mockPrisma = {
    project: {
      findUnique: vi.fn(),
    },
    milestone: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestoneService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MilestoneService>(MilestoneService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a milestone successfully', async () => {
      const createMilestoneDto: CreateMilestoneDto = {
        projectId: 'project-1',
        title: 'Test Milestone',
        dueAt: new Date('2024-12-31'),
        description: 'Test description',
      };

      const project = {
        id: 'project-1',
        organizationId: 'org-1',
      };

      const result = {
        id: 'milestone-1',
        title: 'Test Milestone',
        dueAt: new Date('2024-12-31'),
        status: MilestoneStatus.TODO,
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.milestone.create.mockResolvedValue(result);

      const response = await service.create(createMilestoneDto, 'org-1');

      expect(response).toEqual(result);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
      expect(mockPrisma.milestone.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Milestone',
          dueAt: new Date('2024-12-31'),
          status: MilestoneStatus.TODO,
          project: { connect: { id: 'project-1' } },
        },
      });
    });

    it('should throw error if project does not belong to organization', async () => {
      const createMilestoneDto: CreateMilestoneDto = {
        projectId: 'project-1',
        title: 'Test Milestone',
      };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createMilestoneDto, 'org-1')).rejects.toThrow(
        'Project does not exist or does not belong to your organization'
      );
    });

    it('should set status to OVERDUE for past due dates', async () => {
      const createMilestoneDto: CreateMilestoneDto = {
        projectId: 'project-1',
        title: 'Test Milestone',
        dueAt: new Date('2020-01-01'), // Past date
      };

      const project = {
        id: 'project-1',
        organizationId: 'org-1',
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.milestone.create.mockResolvedValue({
        id: 'milestone-1',
        status: MilestoneStatus.OVERDUE,
      });

      await service.create(createMilestoneDto, 'org-1');

      expect(mockPrisma.milestone.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: MilestoneStatus.OVERDUE,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return milestones for organization', async () => {
      const milestones = [
        { id: '1', title: 'Milestone 1' },
        { id: '2', title: 'Milestone 2' },
      ];

      mockPrisma.milestone.findMany.mockResolvedValue(milestones);

      const result = await service.findAll('project-1', 'org-1');

      expect(result).toEqual(milestones);
      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          project: { organizationId: 'org-1' },
        },
      });
    });
  });

  describe('update', () => {
    it('should update milestone and auto-set OVERDUE status', async () => {
      const updateMilestoneDto: UpdateMilestoneDto = {
        title: 'Updated Milestone',
        dueAt: new Date('2020-01-01'), // Past date
      };

      const existingMilestone = {
        id: 'milestone-1',
        title: 'Original Milestone',
      };

      mockPrisma.milestone.findUnique.mockResolvedValue(existingMilestone);
      mockPrisma.milestone.update.mockResolvedValue({
        id: 'milestone-1',
        title: 'Updated Milestone',
        status: MilestoneStatus.OVERDUE,
      });

      const result = await service.update(
        'milestone-1',
        updateMilestoneDto,
        'org-1'
      );

      expect(result.status).toBe(MilestoneStatus.OVERDUE);
      expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
        where: { id: 'milestone-1' },
        data: expect.objectContaining({
          status: MilestoneStatus.OVERDUE,
        }),
      });
    });
  });

  describe('remove', () => {
    it('should remove milestone', async () => {
      const milestone = {
        id: 'milestone-1',
        project: { organizationId: 'org-1' },
      };

      mockPrisma.milestone.findUnique.mockResolvedValue(milestone);
      mockPrisma.milestone.delete.mockResolvedValue({ id: 'milestone-1' });

      const result = await service.remove('milestone-1', 'org-1');

      expect(result).toEqual({ id: 'milestone-1' });
      expect(mockPrisma.milestone.delete).toHaveBeenCalledWith({
        where: { id: 'milestone-1' },
      });
    });
  });
});
