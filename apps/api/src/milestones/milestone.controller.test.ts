import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import {
  CreateMilestoneDto,
  MilestoneStatus,
} from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { vi } from 'vitest';

describe('MilestoneController', () => {
  let controller: MilestoneController;
  let service: MilestoneService;

  const mockMilestoneService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestoneController],
      providers: [
        {
          provide: MilestoneService,
          useValue: mockMilestoneService,
        },
      ],
    }).compile();

    controller = module.get<MilestoneController>(MilestoneController);
    service = module.get<MilestoneService>(MilestoneService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a milestone', async () => {
      const createMilestoneDto: CreateMilestoneDto = {
        projectId: 'project-1',
        title: 'Test Milestone',
        dueAt: new Date('2024-12-31'),
        description: 'Test description',
      };

      const result = {
        id: '1',
        ...createMilestoneDto,
        status: MilestoneStatus.TODO,
      };

      mockMilestoneService.create.mockResolvedValue(result);

      const response = await controller.create(createMilestoneDto, 'org-1');

      expect(response).toEqual(result);
      expect(mockMilestoneService.create).toHaveBeenCalledWith(
        createMilestoneDto,
        'org-1'
      );
    });
  });

  describe('findAll', () => {
    it('should return all milestones', async () => {
      const milestones = [
        { id: '1', title: 'Milestone 1' },
        { id: '2', title: 'Milestone 2' },
      ];

      mockMilestoneService.findAll.mockResolvedValue(milestones);

      const result = await controller.findAll('project-1', 'org-1');

      expect(result).toEqual(milestones);
      expect(mockMilestoneService.findAll).toHaveBeenCalledWith(
        'project-1',
        'org-1'
      );
    });
  });

  describe('findOne', () => {
    it('should return a single milestone', async () => {
      const milestone = { id: '1', title: 'Test Milestone' };

      mockMilestoneService.findOne.mockResolvedValue(milestone);

      const result = await controller.findOne('1', 'org-1');

      expect(result).toEqual(milestone);
      expect(mockMilestoneService.findOne).toHaveBeenCalledWith('1', 'org-1');
    });
  });

  describe('update', () => {
    it('should update a milestone', async () => {
      const updateMilestoneDto: UpdateMilestoneDto = {
        title: 'Updated Milestone',
        status: MilestoneStatus.COMPLETED,
      };

      const result = {
        id: '1',
        title: 'Updated Milestone',
        status: MilestoneStatus.COMPLETED,
      };

      mockMilestoneService.update.mockResolvedValue(result);

      const response = await controller.update(
        '1',
        updateMilestoneDto,
        'org-1'
      );

      expect(response).toEqual(result);
      expect(mockMilestoneService.update).toHaveBeenCalledWith(
        '1',
        updateMilestoneDto,
        'org-1'
      );
    });
  });

  describe('remove', () => {
    it('should remove a milestone', async () => {
      const result = { id: '1' };
      mockMilestoneService.remove.mockResolvedValue(result);

      const response = await controller.remove('1', 'org-1');

      expect(response).toEqual(result);
      expect(mockMilestoneService.remove).toHaveBeenCalledWith('1', 'org-1');
    });
  });
});
