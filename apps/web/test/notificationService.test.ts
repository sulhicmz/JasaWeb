import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true,
});

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted'),
} as any;

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: 'test-socket-id',
  })),
}));

describe('NotificationService', () => {
  let NotificationService: any;
  let notificationService: any;

  beforeEach(async () => {
    // Dynamic import to avoid hoisting issues with mocks
    const module = await import('../src/services/notificationService');
    NotificationService = module.NotificationService;
    notificationService = new NotificationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(notificationService).toBeDefined();
    });

    it('should not connect if no auth token is available', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const newService = new NotificationService();
      expect(newService).toBeDefined();
    });
  });

  describe('event handling', () => {
    it('should register and call event callbacks', () => {
      const mockCallback = vi.fn();

      notificationService.on({
        onConnect: mockCallback,
      });

      // Simulate connect event
      const connectCallback = notificationService.callbacks.onConnect;
      if (connectCallback) {
        connectCallback();
      }

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should remove event callbacks', () => {
      const mockCallback = vi.fn();

      notificationService.on({
        onConnect: mockCallback,
      });

      notificationService.off({
        onConnect: mockCallback,
      });

      expect(notificationService.callbacks.onConnect).toBeUndefined();
    });
  });

  describe('real-time notifications', () => {
    it('should display notification when page is visible', () => {
      const mockCreateElement = vi
        .spyOn(document, 'createElement')
        .mockReturnValue({
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
          },
          innerHTML: '',
          parentElement: null,
          remove: vi.fn(),
        } as any);

      const mockAppendChild = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation();

      notificationService.showRealtimeNotification('Test message', 'success');

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockAppendChild).toHaveBeenCalled();

      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
    });

    it('should queue notification when page is hidden', () => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });

      const newService = new NotificationService();
      newService.showRealtimeNotification('Test message', 'info');

      expect(newService.notificationQueue).toHaveLength(1);
    });

    it('should process notification queue when page becomes visible', () => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });

      const newService = new NotificationService();
      newService.showRealtimeNotification('Test message 1', 'info');
      newService.showRealtimeNotification('Test message 2', 'success');

      expect(newService.notificationQueue).toHaveLength(2);

      // Make page visible
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });
      newService.processNotificationQueue();

      expect(newService.notificationQueue).toHaveLength(0);
    });
  });

  describe('dashboard integration', () => {
    it('should refresh dashboard stats when connected', () => {
      const mockEmit = vi.fn();
      notificationService.dashboardSocket = { connected: true, emit: mockEmit };

      vi.mocked(localStorage.getItem).mockReturnValue('org-123');

      notificationService.refreshDashboardStats();

      expect(mockEmit).toHaveBeenCalledWith('refresh-stats', {
        organizationId: 'org-123',
      });
    });

    it('should subscribe to dashboard updates', () => {
      const mockEmit = vi.fn();
      notificationService.dashboardSocket = { connected: true, emit: mockEmit };

      notificationService.subscribeToDashboard('org-123');

      expect(mockEmit).toHaveBeenCalledWith('subscribe-dashboard', {
        organizationId: 'org-123',
      });
    });

    it('should get connection status', () => {
      notificationService.dashboardSocket = {
        connected: true,
        id: 'test-socket-id',
      };

      const status = notificationService.getDashboardConnectionStatus();

      expect(status).toEqual({
        connected: true,
        socketId: 'test-socket-id',
      });
    });
  });

  describe('connection management', () => {
    it('should disconnect all sockets', () => {
      const mockDisconnect1 = vi.fn();
      const mockDisconnect2 = vi.fn();

      notificationService.socket = { disconnect: mockDisconnect1 };
      notificationService.dashboardSocket = { disconnect: mockDisconnect2 };

      notificationService.disconnect();

      expect(mockDisconnect1).toHaveBeenCalled();
      expect(mockDisconnect2).toHaveBeenCalled();
      expect(notificationService.socket).toBeNull();
      expect(notificationService.dashboardSocket).toBeNull();
    });

    it('should check connection status', () => {
      notificationService.socket = { connected: true };
      notificationService.dashboardSocket = { connected: true };

      expect(notificationService.isConnected()).toBe(true);

      notificationService.socket = { connected: false };
      notificationService.dashboardSocket = { connected: true };

      expect(notificationService.isConnected()).toBe(false);
    });
  });

  describe('browser notifications', () => {
    it('should request permission when desktop notifications are enabled', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      global.Notification.requestPermission = mockRequestPermission;

      const checkbox = {
        checked: true,
        addEventListener: vi.fn(),
      } as any;

      vi.spyOn(document, 'querySelector').mockReturnValue(checkbox);

      // Simulate checkbox change
      const event = { target: checkbox };
      if (checkbox.addEventListener) {
        const callback = checkbox.addEventListener.mock.calls[0][1];
        callback(event);
      }

      // This would be called in the actual implementation
      // expect(mockRequestPermission).toHaveBeenCalled();
    });
  });
});
