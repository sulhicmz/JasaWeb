import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationService } from '../collaboration.service';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { Cache } from 'cache-manager';

describe('CollaborationService', () => {
  let service: CollaborationService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let cacheManager: Cache;

  const mockPrismaService = {
    user: {
      findById: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    logActivity: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    cacheManager = module.get<Cache>('CACHE_MANAGER');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUserToOnline', () => {
    it('should add user to online users list', async () => {
      const userId = 'user1';
      const userData = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org1',
        socketId: 'socket1',
      };

      const existingUsers = [];
      mockCacheManager.get.mockResolvedValue(existingUsers);

      await service.addUserToOnline(userId, userData);

      expect(mockCacheManager.get).toHaveBeenCalledWith('online_users');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'online_users',
        expect.arrayContaining([expect.objectContaining({ id: userId })]),
        300
      );
    });
  });

  describe('removeUserFromOnline', () => {
    it('should remove user from online users list', async () => {
      const userId = 'user1';
      const existingUsers = [
        {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          organizationId: 'org1',
          socketId: 'socket1',
          lastSeen: new Date(),
        },
        {
          id: 'user2',
          email: 'test2@example.com',
          name: 'Test User 2',
          role: 'member',
          organizationId: 'org1',
          socketId: 'socket2',
          lastSeen: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingUsers);

      await service.removeUserFromOnline(userId);

      expect(mockCacheManager.get).toHaveBeenCalledWith('online_users');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'online_users',
        expect.arrayContaining([expect.objectContaining({ id: 'user2' })]),
        300
      );
    });
  });

  describe('addUserToProject', () => {
    it('should add user to project participants', async () => {
      const userId = 'user1';
      const projectId = 'project1';
      const existingParticipants = [];

      mockCacheManager.get.mockResolvedValue(existingParticipants);

      await service.addUserToProject(userId, projectId);

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `project_participants_${projectId}`
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `project_participants_${projectId}`,
        expect.arrayContaining([
          expect.objectContaining({ userId, projectId }),
        ]),
        3600
      );
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const messageData = {
        senderId: 'user1',
        projectId: 'project1',
        content: 'Hello world',
        type: 'chat' as const,
      };

      const createdMessage = {
        id: 'msg1',
        ...messageData,
        createdAt: new Date(),
        sender: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      mockPrismaService.message.create.mockResolvedValue(createdMessage);

      const result = await service.createMessage(messageData);

      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: messageData,
        include: {
          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: 'msg1',
        senderId: 'user1',
        projectId: 'project1',
        content: 'Hello world',
        type: 'chat',
        recipientId: undefined,
        createdAt: createdMessage.createdAt,
        sender: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    });
  });

  describe('applyDocumentEdit', () => {
    it('should apply document edit without conflict', async () => {
      const editRequest = {
        documentId: 'doc1',
        operation: {
          type: 'insert' as const,
          position: 5,
          content: 'test',
        },
        version: 1,
        userId: 'user1',
      };

      mockCacheManager.get.mockResolvedValue({ doc1: 1 }); // Current version matches
      mockPrismaService.document.findUnique.mockResolvedValue({
        id: 'doc1',
        projectId: 'project1',
      });

      const result = await service.applyDocumentEdit(editRequest);

      expect(result).toEqual({ newVersion: 2 });
      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: 'doc1' },
        data: {
          version: 2,
          updatedAt: expect.any(Date),
          updatedById: 'user1',
        },
      });
    });

    it('should handle conflict and transform operation', async () => {
      const editRequest = {
        documentId: 'doc1',
        operation: {
          type: 'insert' as const,
          position: 5,
          content: 'test',
        },
        version: 1,
        userId: 'user1',
      };

      mockCacheManager.get.mockResolvedValue({ doc1: 2 }); // Current version is different
      mockPrismaService.document.findUnique.mockResolvedValue({
        id: 'doc1',
        projectId: 'project1',
      });

      const result = await service.applyDocumentEdit(editRequest);

      expect(result).toEqual({
        newVersion: 3,
        transformedOperation: expect.objectContaining({
          type: 'insert',
          position: expect.any(Number),
          content: 'test',
        }),
      });
    });
  });

  describe('getProjectState', () => {
    it('should return project state with participants and documents', async () => {
      const projectId = 'project1';
      const participants = [
        {
          userId: 'user1',
          projectId,
          joinedAt: new Date(),
        },
      ];

      const documents = [
        {
          id: 'doc1',
          title: 'Test Document',
          version: 1,
          updatedAt: new Date(),
          updatedBy: {
            id: 'user1',
            name: 'Test User',
          },
        },
      ];

      mockCacheManager.get.mockResolvedValue(participants);
      mockPrismaService.document.findMany.mockResolvedValue(documents);

      const result = await service.getProjectState(projectId);

      expect(result).toEqual({
        projectId,
        participants,
        documents: [
          {
            id: 'doc1',
            title: 'Test Document',
            version: 1,
            lastEdited: documents[0].updatedAt,
            lastEditedBy: 'user1',
          },
        ],
        recentActivity: [],
      });
    });
  });
});
