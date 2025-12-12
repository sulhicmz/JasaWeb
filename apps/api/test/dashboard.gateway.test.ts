import { DashboardGateway } from '../src/dashboard/dashboard.gateway';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { MultiTenantPrismaService } from '../src/common/database/multi-tenant-prisma.service';

describe('DashboardGateway', () => {
  let gateway: DashboardGateway;
  let mockCacheManager: jest.Mocked<Cache>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockPrismaService: jest.Mocked<MultiTenantPrismaService>;
  let mockClient: any;
  let mockServer: any;

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    mockJwtService = {
      verifyAsync: jest.fn(),
    } as any;

    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      ticket: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      milestone: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    mockClient = {
      id: 'test-client-id',
      handshake: {
        auth: {
          token: 'test-token',
        },
        headers: {},
        query: {},
      },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    };

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    gateway = new DashboardGateway(
      mockCacheManager,
      mockJwtService,
      mockPrismaService
    );
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate and connect client successfully', async () => {
      const payload = {
        sub: 'user-123',
        organizationId: 'org-123',
        role: 'org_owner',
      };
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        memberships: [{ organizationId: 'org-123' }],
      };

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(user);

      await gateway.handleConnection(mockClient);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('test-token');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          memberships: {
            where: { organizationId: 'org-123' },
          },
        },
      });
      expect(mockClient.join).toHaveBeenCalledWith(
        `org-${payload.organizationId}`
      );
      expect(mockClient.join).toHaveBeenCalledWith(`user-${payload.sub}`);
    });

    it('should handle authentication failure', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication failed',
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      gateway.handleDisconnect(mockClient);
      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('broadcastDashboardUpdate', () => {
    it('should broadcast update to organization members', async () => {
      const updateData = {
        type: 'stats' as const,
        data: { projects: 5 },
        timestamp: new Date(),
        organizationId: 'org-123',
      };

      await gateway.broadcastDashboardUpdate(updateData);

      expect(mockServer.to).toHaveBeenCalledWith('org-org-123');
      expect(mockServer.emit).toHaveBeenCalledWith('dashboard-update', {
        type: 'stats',
        data: { projects: 5 },
        timestamp: updateData.timestamp,
      });
    });

    it('should send personal update for user-specific data', async () => {
      const updateData = {
        type: 'ticket' as const,
        data: { userId: 'user-123', ticketId: 'ticket-456' },
        timestamp: new Date(),
        organizationId: 'org-123',
      };

      await gateway.broadcastDashboardUpdate(updateData);

      expect(mockServer.to).toHaveBeenCalledWith('org-org-123');
      expect(mockServer.to).toHaveBeenCalledWith('user-user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('personal-update', {
        type: 'ticket',
        data: { userId: 'user-123', ticketId: 'ticket-456' },
        timestamp: updateData.timestamp,
      });
    });
  });

  describe('handleSubscribeDashboard', () => {
    it('should subscribe client to dashboard updates', async () => {
      const clientWithAuth = {
        ...mockClient,
        userId: 'user-123',
        organizationId: 'org-123',
        userRole: 'org_owner',
      };

      const data = { organizationId: 'org-123' };

      await gateway.handleSubscribeDashboard(data, clientWithAuth);

      expect(mockClient.join).toHaveBeenCalledWith('org-org-123');
      expect(mockClient.emit).toHaveBeenCalledWith('subscribed', {
        room: 'org-org-123',
      });
    });

    it('should throw error for different organization', async () => {
      const clientWithAuth = {
        ...mockClient,
        userId: 'user-123',
        organizationId: 'org-123',
        userRole: 'org_owner',
      };

      const data = { organizationId: 'org-456' };

      await expect(
        gateway.handleSubscribeDashboard(data, clientWithAuth)
      ).rejects.toThrow(
        'Unauthorized: Cannot subscribe to different organization'
      );
    });
  });

  describe('handleUnsubscribeDashboard', () => {
    it('should unsubscribe client from dashboard updates', async () => {
      const data = { organizationId: 'org-123' };

      await gateway.handleUnsubscribeDashboard(data, mockClient);

      expect(mockClient.leave).toHaveBeenCalledWith('org-org-123');
      expect(mockClient.emit).toHaveBeenCalledWith('unsubscribed', {
        room: 'org-org-123',
      });
    });
  });

  describe('handleRefreshStats', () => {
    it('should refresh stats and broadcast to organization', async () => {
      const clientWithAuth = {
        ...mockClient,
        userId: 'user-123',
        organizationId: 'org-123',
        userRole: 'org_owner',
      };

      const data = { organizationId: 'org-123' };

      // Mock the cache to return null so fresh stats are fetched
      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);

      // Mock the Prisma calls
      (mockPrismaService.project.findMany as jest.Mock).mockResolvedValue([
        { status: 'active' },
        { status: 'completed' },
      ]);
      (mockPrismaService.ticket.findMany as jest.Mock).mockResolvedValue([
        { status: 'open', priority: 'high' },
      ]);
      (mockPrismaService.invoice.findMany as jest.Mock).mockResolvedValue([
        { status: 'issued', amount: 5000 },
      ]);
      (mockPrismaService.milestone.findMany as jest.Mock).mockResolvedValue([
        { status: 'completed', dueAt: new Date() },
      ]);

      await gateway.handleRefreshStats(data, clientWithAuth);

      expect(mockServer.to).toHaveBeenCalledWith('org-org-123');
      expect(mockServer.emit).toHaveBeenCalledWith('stats-updated', {
        stats: expect.any(Object),
        timestamp: expect.any(Date),
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'dashboard-stats-org-123'
      );
    });
  });
});
