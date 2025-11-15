import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../common/database/prisma.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { NotificationGateway } from './notification.gateway';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;
  let multiTenantPrisma: MultiTenantPrismaService;
  let gateway: NotificationGateway;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockMultiTenantPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockGateway = {
    sendNotificationToUser: jest.fn(),
    sendNotificationUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrisma,
        },
        {
          provide: NotificationGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
    gateway = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification and send via WebSocket', async () => {
      const userId = 'user1';
      const organizationId = 'org1';
      const dto = {
        userId,
        organizationId,
        type: 'project_update' as const,
        title: 'Project Updated',
        message: 'Test project was updated',
        data: { projectId: 'project1' },
      };

      const mockPreference = {
        id: 'pref1',
        userId,
        organizationId,
        type: 'project_update',
        inAppEnabled: true,
        emailEnabled: true,
        browserEnabled: false,
      };

      const mockNotification = {
        id: 'notif1',
        ...dto,
        isRead: false,
        createdAt: new Date(),
        user: { id: userId, name: 'Test User', email: 'test@example.com' },
      };

      mockMultiTenantPrisma.notificationPreference.findUnique.mockResolvedValue(
        mockPreference
      );
      mockMultiTenantPrisma.notification.create.mockResolvedValue(
        mockNotification
      );

      await service.createNotification(dto);

      expect(
        mockMultiTenantPrisma.notificationPreference.findUnique
      ).toHaveBeenCalledWith({
        where: {
          userId_organizationId_type: {
            userId,
            organizationId,
            type: 'project_update',
          },
        },
      });

      expect(mockMultiTenantPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          organizationId,
          type: 'project_update',
          title: 'Project Updated',
          message: 'Test project was updated',
          data: { projectId: 'project1' },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(gateway.sendNotificationToUser).toHaveBeenCalledWith(userId, {
        id: 'notif1',
        type: 'project_update',
        title: 'Project Updated',
        message: 'Test project was updated',
        data: { projectId: 'project1' },
        isRead: false,
        createdAt: mockNotification.createdAt,
      });
    });

    it('should not create notification if in-app is disabled', async () => {
      const userId = 'user1';
      const organizationId = 'org1';
      const dto = {
        userId,
        organizationId,
        type: 'project_update' as const,
        title: 'Project Updated',
        message: 'Test project was updated',
      };

      const mockPreference = {
        id: 'pref1',
        userId,
        organizationId,
        type: 'project_update',
        inAppEnabled: false,
        emailEnabled: true,
        browserEnabled: false,
      };

      mockMultiTenantPrisma.notificationPreference.findUnique.mockResolvedValue(
        mockPreference
      );

      await service.createNotification(dto);

      expect(mockMultiTenantPrisma.notification.create).not.toHaveBeenCalled();
      expect(gateway.sendNotificationToUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with pagination', async () => {
      const userId = 'user1';
      const organizationId = 'org1';
      const mockNotifications = [
        {
          id: 'notif1',
          type: 'project_update',
          title: 'Project Updated',
          message: 'Test project was updated',
          isRead: false,
          createdAt: new Date(),
          user: { id: userId, name: 'Test User', email: 'test@example.com' },
        },
      ];

      mockMultiTenantPrisma.notification.findMany.mockResolvedValue(
        mockNotifications
      );
      mockMultiTenantPrisma.notification.count.mockResolvedValue(1);

      const result = await service.getUserNotifications(
        userId,
        organizationId,
        {
          limit: 10,
          offset: 0,
        }
      );

      expect(mockMultiTenantPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 1,
        unread: expect.any(Number),
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and send update', async () => {
      const notificationId = 'notif1';
      const userId = 'user1';

      mockMultiTenantPrisma.notification.updateMany.mockResolvedValue({
        count: 1,
      });

      await service.markAsRead(notificationId, userId);

      expect(
        mockMultiTenantPrisma.notification.updateMany
      ).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });

      expect(gateway.sendNotificationUpdate).toHaveBeenCalledWith(userId, {
        notificationId,
        isRead: true,
      });
    });
  });

  describe('notifyProjectUpdate', () => {
    it('should create project update notification', async () => {
      const userId = 'user1';
      const organizationId = 'org1';
      const projectId = 'project1';
      const projectName = 'Test Project';
      const actorName = 'John Doe';

      const createNotificationSpy = jest.spyOn(service, 'createNotification');
      createNotificationSpy.mockResolvedValue();

      await service.notifyProjectUpdate(
        userId,
        organizationId,
        projectId,
        projectName,
        actorName
      );

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId,
        organizationId,
        type: 'project_update',
        title: 'Project Updated',
        message: `${actorName} updated project "${projectName}"`,
        data: {
          projectId,
          projectName,
          actorName,
        },
      });
    });
  });
});
