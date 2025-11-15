import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalService } from './approval.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let multiTenantPrisma: MultiTenantPrismaService;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    organizationId: 'org-1',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApproval = {
    id: 'approval-1',
    projectId: 'project-1',
    itemType: 'design',
    itemId: 'item-1',
    status: 'pending',
    decidedById: null,
    decidedAt: null,
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApprovedApproval = {
    ...mockApproval,
    status: 'approved',
    decidedById: 'user-1',
    decidedAt: new Date(),
    note: 'Looks good!',
  };

  const mockRejectedApproval = {
    ...mockApproval,
    status: 'rejected',
    decidedById: 'user-1',
    decidedAt: new Date(),
    note: 'Needs revision',
  };

  const mockMultiTenantPrismaService = {
    project: {
      findUnique: jest.fn(),
    },
    approval: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApproval', () => {
    const createApprovalData = {
      organizationId: 'org-1',
      projectId: 'project-1',
      itemType: 'design',
      itemId: 'item-1',
      requesterId: 'user-1',
    };

    it('should create a new approval successfully', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.approval.create.mockResolvedValue(
        mockApproval
      );

      const result = await service.createApproval(
        createApprovalData.organizationId,
        createApprovalData.projectId,
        createApprovalData.itemType,
        createApprovalData.itemId,
        createApprovalData.requesterId
      );

      expect(
        mockMultiTenantPrismaService.project.findUnique
      ).toHaveBeenCalledWith({
        where: { id: createApprovalData.projectId },
      });

      expect(mockMultiTenantPrismaService.approval.create).toHaveBeenCalledWith(
        {
          data: {
            projectId: createApprovalData.projectId,
            itemType: createApprovalData.itemType,
            itemId: createApprovalData.itemId,
            status: 'pending',
          },
        }
      );

      expect(result).toEqual(mockApproval);
    });

    it('should throw BadRequestException if project not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.createApproval(
          createApprovalData.organizationId,
          'non-existent-project',
          createApprovalData.itemType,
          createApprovalData.itemId,
          createApprovalData.requesterId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createApproval(
          createApprovalData.organizationId,
          'non-existent-project',
          createApprovalData.itemType,
          createApprovalData.itemId,
          createApprovalData.requesterId
        )
      ).rejects.toThrow(
        'Project not found or does not belong to your organization'
      );
    });

    it('should handle different item types', async () => {
      const pageApprovalData = {
        ...createApprovalData,
        itemType: 'page',
      };

      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.approval.create.mockResolvedValue({
        ...mockApproval,
        itemType: 'page',
      });

      const result = await service.createApproval(
        pageApprovalData.organizationId,
        pageApprovalData.projectId,
        pageApprovalData.itemType,
        pageApprovalData.itemId,
        pageApprovalData.requesterId
      );

      expect(result.itemType).toBe('page');
      expect(mockMultiTenantPrismaService.approval.create).toHaveBeenCalledWith(
        {
          data: {
            projectId: pageApprovalData.projectId,
            itemType: pageApprovalData.itemType,
            itemId: pageApprovalData.itemId,
            status: 'pending',
          },
        }
      );
    });
  });

  describe('findApprovalsForProject', () => {
    const findApprovalsData = {
      projectId: 'project-1',
      organizationId: 'org-1',
    };

    it('should return approvals for a project successfully', async () => {
      const approvals = [mockApproval];
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.approval.findMany.mockResolvedValue(
        approvals
      );

      const result = await service.findApprovalsForProject(
        findApprovalsData.projectId,
        findApprovalsData.organizationId
      );

      expect(
        mockMultiTenantPrismaService.project.findUnique
      ).toHaveBeenCalledWith({
        where: { id: findApprovalsData.projectId },
      });

      expect(
        mockMultiTenantPrismaService.approval.findMany
      ).toHaveBeenCalledWith({
        where: {
          projectId: findApprovalsData.projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(approvals);
    });

    it('should throw BadRequestException if project not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.findApprovalsForProject('non-existent-project', 'org-1')
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.findApprovalsForProject('non-existent-project', 'org-1')
      ).rejects.toThrow(
        'Project not found or does not belong to your organization'
      );
    });

    it('should return empty array when no approvals exist', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.approval.findMany.mockResolvedValue([]);

      const result = await service.findApprovalsForProject(
        findApprovalsData.projectId,
        findApprovalsData.organizationId
      );

      expect(result).toEqual([]);
      expect(mockMultiTenantPrismaService.approval.findMany).toHaveBeenCalled();
    });
  });

  describe('approveApproval', () => {
    const approveApprovalData = {
      approvalId: 'approval-1',
      approverId: 'user-1',
      organizationId: 'org-1',
      note: 'Looks good!',
    };

    it('should approve an approval successfully', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApproval
      );
      mockMultiTenantPrismaService.approval.update.mockResolvedValue(
        mockApprovedApproval
      );

      const result = await service.approveApproval(
        approveApprovalData.approvalId,
        approveApprovalData.approverId,
        approveApprovalData.organizationId,
        approveApprovalData.note
      );

      expect(
        mockMultiTenantPrismaService.approval.findUnique
      ).toHaveBeenCalledWith({
        where: { id: approveApprovalData.approvalId },
      });

      expect(mockMultiTenantPrismaService.approval.update).toHaveBeenCalledWith(
        {
          where: { id: approveApprovalData.approvalId },
          data: {
            status: 'approved',
            decidedById: approveApprovalData.approverId,
            decidedAt: expect.any(Date),
            note: approveApprovalData.note,
          },
        }
      );

      expect(result).toEqual(mockApprovedApproval);
    });

    it('should approve an approval without note', async () => {
      const approvalWithoutNote = {
        ...mockApprovedApproval,
        note: null,
      };

      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApproval
      );
      mockMultiTenantPrismaService.approval.update.mockResolvedValue(
        approvalWithoutNote
      );

      const result = await service.approveApproval(
        approveApprovalData.approvalId,
        approveApprovalData.approverId,
        approveApprovalData.organizationId
      );

      expect(result.note).toBeNull();
      expect(mockMultiTenantPrismaService.approval.update).toHaveBeenCalledWith(
        {
          where: { id: approveApprovalData.approvalId },
          data: {
            status: 'approved',
            decidedById: approveApprovalData.approverId,
            decidedAt: expect.any(Date),
            note: undefined,
          },
        }
      );
    });

    it('should throw BadRequestException if approval not found', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(null);

      await expect(
        service.approveApproval(
          'non-existent-approval',
          approveApprovalData.approverId,
          approveApprovalData.organizationId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.approveApproval(
          'non-existent-approval',
          approveApprovalData.approverId,
          approveApprovalData.organizationId
        )
      ).rejects.toThrow('Approval not found');
    });

    it('should throw BadRequestException if approval already processed', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApprovedApproval
      );

      await expect(
        service.approveApproval(
          approveApprovalData.approvalId,
          approveApprovalData.approverId,
          approveApprovalData.organizationId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.approveApproval(
          approveApprovalData.approvalId,
          approveApprovalData.approverId,
          approveApprovalData.organizationId
        )
      ).rejects.toThrow('Approval has already been processed');
    });

    it('should throw BadRequestException if approval already rejected', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockRejectedApproval
      );

      await expect(
        service.approveApproval(
          approveApprovalData.approvalId,
          approveApprovalData.approverId,
          approveApprovalData.organizationId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.approveApproval(
          approveApprovalData.approvalId,
          approveApprovalData.approverId,
          approveApprovalData.organizationId
        )
      ).rejects.toThrow('Approval has already been processed');
    });
  });

  describe('rejectApproval', () => {
    const rejectApprovalData = {
      approvalId: 'approval-1',
      rejecterId: 'user-1',
      organizationId: 'org-1',
      note: 'Needs revision',
    };

    it('should reject an approval successfully', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApproval
      );
      mockMultiTenantPrismaService.approval.update.mockResolvedValue(
        mockRejectedApproval
      );

      const result = await service.rejectApproval(
        rejectApprovalData.approvalId,
        rejectApprovalData.rejecterId,
        rejectApprovalData.organizationId,
        rejectApprovalData.note
      );

      expect(
        mockMultiTenantPrismaService.approval.findUnique
      ).toHaveBeenCalledWith({
        where: { id: rejectApprovalData.approvalId },
      });

      expect(mockMultiTenantPrismaService.approval.update).toHaveBeenCalledWith(
        {
          where: { id: rejectApprovalData.approvalId },
          data: {
            status: 'rejected',
            decidedById: rejectApprovalData.rejecterId,
            decidedAt: expect.any(Date),
            note: rejectApprovalData.note,
          },
        }
      );

      expect(result).toEqual(mockRejectedApproval);
    });

    it('should reject an approval without note', async () => {
      const rejectionWithoutNote = {
        ...mockRejectedApproval,
        note: null,
      };

      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApproval
      );
      mockMultiTenantPrismaService.approval.update.mockResolvedValue(
        rejectionWithoutNote
      );

      const result = await service.rejectApproval(
        rejectApprovalData.approvalId,
        rejectApprovalData.rejecterId,
        rejectApprovalData.organizationId
      );

      expect(result.note).toBeNull();
      expect(mockMultiTenantPrismaService.approval.update).toHaveBeenCalledWith(
        {
          where: { id: rejectApprovalData.approvalId },
          data: {
            status: 'rejected',
            decidedById: rejectApprovalData.rejecterId,
            decidedAt: expect.any(Date),
            note: undefined,
          },
        }
      );
    });

    it('should throw BadRequestException if approval not found', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectApproval(
          'non-existent-approval',
          rejectApprovalData.rejecterId,
          rejectApprovalData.organizationId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.rejectApproval(
          'non-existent-approval',
          rejectApprovalData.rejecterId,
          rejectApprovalData.organizationId
        )
      ).rejects.toThrow('Approval not found');
    });

    it('should throw BadRequestException if approval already processed', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockRejectedApproval
      );

      await expect(
        service.rejectApproval(
          rejectApprovalData.approvalId,
          rejectApprovalData.rejecterId,
          rejectApprovalData.organizationId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.rejectApproval(
          rejectApprovalData.approvalId,
          rejectApprovalData.rejecterId,
          rejectApprovalData.organizationId
        )
      ).rejects.toThrow('Approval has already been processed');
    });

    it('should throw BadRequestException if approval already approved', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApprovedApproval
      );

      await expect(
        service.rejectApproval(
          rejectApprovalData.approvalId,
          rejectApprovalData.rejecterId,
          rejectApprovalData.organizationId
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.rejectApproval(
          rejectApprovalData.approvalId,
          rejectApprovalData.rejecterId,
          rejectApprovalData.organizationId
        )
      ).rejects.toThrow('Approval has already been processed');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        service.createApproval(
          'org-1',
          'project-1',
          'design',
          'item-1',
          'user-1'
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle approval creation errors', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.approval.create.mockRejectedValue(
        new Error('Failed to create approval')
      );

      await expect(
        service.createApproval(
          'org-1',
          'project-1',
          'design',
          'item-1',
          'user-1'
        )
      ).rejects.toThrow('Failed to create approval');
    });

    it('should handle approval update errors', async () => {
      mockMultiTenantPrismaService.approval.findUnique.mockResolvedValue(
        mockApproval
      );
      mockMultiTenantPrismaService.approval.update.mockRejectedValue(
        new Error('Failed to update approval')
      );

      await expect(
        service.approveApproval('approval-1', 'user-1', 'org-1')
      ).rejects.toThrow('Failed to update approval');
    });
  });
});
