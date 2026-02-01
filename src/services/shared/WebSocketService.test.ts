import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webSocketService, UserRole, type WSMessage } from '@/services/shared/WebSocketService';
import { realTimeNotificationService } from '@/services/domain/RealTimeNotificationService';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn()
  },
  webSocketConnection: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn()
  },
  webSocketMessageQueue: {
    create: vi.fn(),
    deleteMany: vi.fn()
  },
  webSocketEvent: {
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn()
  },
  webSocketRoomMembership: {
    findMany: vi.fn(),
    distinct: vi.fn(),
    select: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn()
  },
  realTimeNotification: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  $transaction: vi.fn()
};

// Mock getPrisma to return our mock client
vi.mock('@/lib/prisma', () => ({
  getPrisma: vi.fn(() => mockPrisma)
}));

// Mock context - not needed since we're mocking getPrisma directly
const mockContext = {};

describe('WebSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should establish WebSocket connection successfully', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com', role: 'client' };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    
    const mockConnection = {
      id: 'conn1',
      userId: 'user1',
      connectionId: 'ws_123_abc',
      role: 'client',
      isAlive: true,
      rooms: []
    };
    mockPrisma.webSocketConnection.create.mockResolvedValue(mockConnection);
    mockPrisma.webSocketMessageQueue.create.mockResolvedValue({});
    mockPrisma.webSocketEvent.updateMany.mockResolvedValue({ count: 1 });

    const result = await webSocketService.connect(mockContext, 'user1', UserRole.CLIENT);
    
    expect(result.success).toBe(true);
    expect(result.connectionId).toMatch(/^ws_\d+_\w+$/); // Match generated connection ID pattern
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user1' }
    });
  });

  it('should reject connection for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    
    const result = await webSocketService.connect(mockContext, 'nonexistent', UserRole.CLIENT);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('should disconnect WebSocket connection', async () => {
    const mockConnection = {
      id: 'conn1',
      userId: 'user1',
      connectionId: 'ws_123_abc',
      role: 'client',
      rooms: ['room1', 'room2']
    };
    mockPrisma.webSocketConnection.findUnique.mockResolvedValue(mockConnection);
    mockPrisma.webSocketRoomMembership.deleteMany.mockResolvedValue({ count: 2 });
    
    // Mock the update calls
    mockPrisma.webSocketConnection.update.mockResolvedValueOnce({});
    mockPrisma.webSocketConnection.update.mockResolvedValueOnce({});
    mockPrisma.webSocketConnection.findUnique.mockResolvedValue(mockConnection);
    
    await webSocketService.disconnect(mockContext, 'ws_123_abc');
    
    expect(mockPrisma.webSocketConnection.findUnique).toHaveBeenCalledWith({
      where: { connectionId: 'ws_123_abc' }
    });
  });

  it('should handle heartbeat correctly', async () => {
    mockPrisma.webSocketConnection.updateMany.mockResolvedValue({ count: 1 });
    
    const result = await webSocketService.heartbeat(mockContext, 'ws_123_abc');
    
    expect(result).toBe(true);
    expect(mockPrisma.webSocketConnection.updateMany).toHaveBeenCalledWith({
      where: { connectionId: 'ws_123_abc', isAlive: true },
      data: { lastActivity: expect.any(Date) }
    });
  });

  it('should broadcast to all connections', async () => {
    const mockConnections = [
      { connectionId: 'conn1', isAlive: true },
      { connectionId: 'conn2', isAlive: true }
    ];
    mockPrisma.webSocketConnection.findMany.mockResolvedValue(mockConnections);
    mockPrisma.webSocketMessageQueue.create.mockResolvedValue({});
    mockPrisma.webSocketEvent.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.webSocketEvent.create.mockResolvedValue({});
    
    const event: WSMessage = {
      type: 'system_alert',
      payload: { message: 'Test message' },
      timestamp: Date.now(),
      id: 'evt_123_abc'
    };
    
    await webSocketService.broadcast(mockContext, event);
    
    expect(mockPrisma.webSocketConnection.findMany).toHaveBeenCalledWith({
      where: { isAlive: true }
    });
    expect(mockPrisma.webSocketMessageQueue.create).toHaveBeenCalledTimes(2);
  });

  it('should send message to specific user', async () => {
    const mockConnections = [
      { connectionId: 'conn1', userId: 'user1', isAlive: true }
    ];
    mockPrisma.webSocketConnection.findMany.mockResolvedValue(mockConnections);
    mockPrisma.webSocketMessageQueue.create.mockResolvedValue({});
    mockPrisma.webSocketEvent.updateMany.mockResolvedValue({ count: 1 });
    
    const event: WSMessage = {
      type: 'system_alert',
      payload: { message: 'User-specific message' },
      timestamp: Date.now(),
      id: 'evt_123_abc'
    };
    
    await webSocketService.sendToUser(mockContext, 'user1', event);
    
    expect(mockPrisma.webSocketConnection.findMany).toHaveBeenCalledWith({
      where: { userId: 'user1', isAlive: true }
    });
  });

  it('should send message to specific role', async () => {
    const mockConnections = [
      { connectionId: 'conn1', role: 'admin', isAlive: true },
      { connectionId: 'conn2', role: 'admin', isAlive: true }
    ];
    mockPrisma.webSocketConnection.findMany.mockResolvedValue(mockConnections);
    mockPrisma.webSocketMessageQueue.create.mockResolvedValue({});
    mockPrisma.webSocketEvent.updateMany.mockResolvedValue({ count: 1 });
    
    const event: WSMessage = {
      type: 'admin_broadcast',
      payload: { message: 'Admin message' },
      timestamp: Date.now(),
      id: 'evt_123_abc'
    };
    
    await webSocketService.sendToRole(mockContext, UserRole.ADMIN, event);
    
    expect(mockPrisma.webSocketConnection.findMany).toHaveBeenCalledWith({
      where: { role: 'admin', isAlive: true }
    });
  });

  it('should join room successfully', async () => {
    const mockConnection = {
      connectionId: 'conn1',
      rooms: ['room1']
    };
    mockPrisma.webSocketConnection.findUnique.mockResolvedValue(mockConnection);
    mockPrisma.webSocketConnection.update.mockResolvedValue({});
    mockPrisma.webSocketRoomMembership.upsert.mockResolvedValue({});
    
    await webSocketService.joinRoom(mockContext, 'conn1', 'room2');
    
    expect(mockPrisma.webSocketConnection.findUnique).toHaveBeenCalledWith({
      where: { connectionId: 'conn1' }
    });
    expect(mockPrisma.webSocketConnection.update).toHaveBeenCalledWith({
      where: { connectionId: 'conn1' },
      data: {
        rooms: expect.any(Array)
      }
    });
  });

  it('should leave room successfully', async () => {
    const mockConnection = {
      connectionId: 'conn1',
      rooms: ['room1', 'room2']
    };
    mockPrisma.webSocketConnection.findUnique.mockResolvedValue(mockConnection);
    mockPrisma.webSocketConnection.update.mockResolvedValue({});
    mockPrisma.webSocketRoomMembership.deleteMany.mockResolvedValue({});
    
    await webSocketService.leaveRoom(mockContext, 'conn1', 'room1');
    
    expect(mockPrisma.webSocketConnection.findUnique).toHaveBeenCalledWith({
      where: { connectionId: 'conn1' }
    });
    expect(mockPrisma.webSocketConnection.update).toHaveBeenCalledWith({
      where: { connectionId: 'conn1' },
      data: {
        rooms: expect.arrayContaining(['room2'])
      }
    });
  });

  it('should get connections with filters', async () => {
    const mockConnections = [
      {
        id: 'conn1',
        userId: 'user1',
        connectionId: 'ws_123',
        role: 'client',
        isAlive: true,
        rooms: []
      }
    ];
    mockPrisma.webSocketConnection.findMany.mockResolvedValue(mockConnections);
    
    const result = await webSocketService.getConnections(mockContext, { 
      role: UserRole.CLIENT 
    });
    
    expect(mockPrisma.webSocketConnection.findMany).toHaveBeenCalledWith({
      where: { isAlive: true, role: 'client' },
      include: { user: true }
    });
    expect(result).toEqual(mockConnections);
  });

  it('should get all active rooms', async () => {
    const mockRoomMemberships = [
      { roomId: 'room1' },
      { roomId: 'room2' }
    ];
    mockPrisma.webSocketRoomMembership.findMany.mockResolvedValue(mockRoomMemberships);
    
    const result = await webSocketService.getRooms(mockContext);
    
    expect(mockPrisma.webSocketRoomMembership.findMany).toHaveBeenCalledWith({
      distinct: ['roomId'],
      select: { roomId: true }
    });
    expect(result).toEqual(['room1', 'room2']);
  });
});

describe('RealTimeNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create notification and send real-time update', async () => {
    const mockNotification = {
      id: 'notif1',
      userId: 'user1',
      type: 'system_announcement',
      title: 'Test Title',
      message: 'Test Message',
      priority: 'medium',
      read: false,
      createdAt: new Date()
    };
    
    mockPrisma.realTimeNotification.create.mockResolvedValue(mockNotification);
    
    // Mock WebSocketService broadcast
    vi.spyOn(webSocketService, 'sendToUser').mockResolvedValue();
    
    const result = await realTimeNotificationService.createNotification(mockContext, 'user1', {
      type: 'system_announcement',
      title: 'Test Title',
      message: 'Test Message',
      priority: 'medium'
    });
    
    expect(mockPrisma.realTimeNotification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user1',
        type: 'system_announcement',
        title: 'Test Title',
        message: 'Test Message',
        payload: undefined,
        priority: 'medium'
      }
    });
    expect(result).toEqual(mockNotification);
  });

  it('should send bulk notifications to multiple users', async () => {
    const mockNotifications = [
      { id: 'notif1', userId: 'user1' },
      { id: 'notif2', userId: 'user2' }
    ];
    
    mockPrisma.realTimeNotification.create
      .mockResolvedValueOnce(mockNotifications[0])
      .mockResolvedValueOnce(mockNotifications[1]);
    
    vi.spyOn(webSocketService, 'sendToUser').mockResolvedValue();
    
    const result = await realTimeNotificationService.bulkCreateNotifications(
      mockContext, 
      ['user1', 'user2'], 
      {
        type: 'system_announcement',
        title: 'Bulk Message',
        message: 'This is a bulk message'
      }
    );
    
    expect(result).toEqual(mockNotifications);
    expect(mockPrisma.realTimeNotification.create).toHaveBeenCalledTimes(2);
  });

  it('should get notifications with filters', async () => {
    const mockNotifications = [
      {
        id: 'notif1',
        userId: 'user1',
        type: 'system_announcement',
        title: 'Test',
        message: 'Test message',
        read: false,
        priority: 'medium',
        createdAt: new Date(),
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
      }
    ];
    
    mockPrisma.realTimeNotification.findMany.mockResolvedValue(mockNotifications);
    
    const result = await realTimeNotificationService.getNotifications(mockContext, {
      userId: 'user1',
      read: false,
      limit: 10,
      offset: 0
    });
    
    expect(mockPrisma.realTimeNotification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user1', read: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0,
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    expect(result).toEqual(mockNotifications);
  });

  it('should mark notification as read', async () => {
    const mockNotification = {
      id: 'notif1',
      userId: 'user1',
      read: true,
      readAt: new Date()
    };
    
    mockPrisma.realTimeNotification.update.mockResolvedValue(mockNotification);
    
    const result = await realTimeNotificationService.markAsRead(mockContext, 'notif1', 'user1');
    
    expect(mockPrisma.realTimeNotification.update).toHaveBeenCalledWith({
      where: { id: 'notif1', userId: 'user1' },
      data: { read: true, readAt: expect.any(Date) }
    });
    expect(result).toEqual(mockNotification);
  });

  it('should mark all notifications as read for user', async () => {
    mockPrisma.realTimeNotification.updateMany.mockResolvedValue({ count: 5 });
    
    const result = await realTimeNotificationService.markAllAsRead(mockContext, 'user1');
    
    expect(mockPrisma.realTimeNotification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user1', read: false },
      data: { read: true, readAt: expect.any(Date) }
    });
    expect(result).toBe(5);
  });

  it('should delete notification', async () => {
    mockPrisma.realTimeNotification.delete.mockResolvedValue({});
    
    await realTimeNotificationService.deleteNotification(mockContext, 'notif1', 'user1');
    
    expect(mockPrisma.realTimeNotification.delete).toHaveBeenCalledWith({
      where: { id: 'notif1', userId: 'user1' }
    });
  });

  it('should get notification stats', async () => {
    const mockNotifications = [
      { type: 'system_announcement', priority: 'medium', read: false },
      { type: 'payment_received', priority: 'high', read: true },
      { type: 'system_announcement', priority: 'low', read: false }
    ];
    
    mockPrisma.realTimeNotification.findMany.mockResolvedValue(mockNotifications);
    
    const result = await realTimeNotificationService.getNotificationStats(mockContext, 'user1');
    
    expect(result).toEqual({
      total: 3,
      unread: 2,
      byPriority: {
        high: 1,
        medium: 1,
        low: 1,
        critical: 0
      },
      byType: {
        system_announcement: 2,
        payment_received: 1
      }
    });
  });

  it('should cleanup old notifications', async () => {
    mockPrisma.realTimeNotification.deleteMany.mockResolvedValue({ count: 10 });
    
    const result = await realTimeNotificationService.cleanupOldNotifications(mockContext, 30);
    
    expect(mockPrisma.realTimeNotification.deleteMany).toHaveBeenCalled();
    expect(result).toBe(10);
  });
});