import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
<<<<<<< HEAD
import { logger } from '@jasaweb/config';
=======
// Simple logger fallback for web app
const logger = {
  debug: (message: string, data?: Record<string, unknown>) =>
    console.debug(`[DEBUG] ${message}`, data),
  info: (message: string, data?: Record<string, unknown>) =>
    console.info(`[INFO] ${message}`, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    console.warn(`[WARN] ${message}`, data),
  error: (message: string, error?: Error | Record<string, unknown>) =>
    console.error(`[ERROR] ${message}`, error),
  performance: (
    metric: string,
    value: number,
    details?: Record<string, unknown>
  ) => console.info(`[PERF] ${metric}: ${value}ms`, details),
};
>>>>>>> origin/dev

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'personal';

export interface NotificationData {
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: NotificationData;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationUpdate {
  notificationId?: string;
  isRead?: boolean;
  allRead?: boolean;
}

export interface DashboardUpdate {
  type: 'stats' | 'activity' | 'project' | 'ticket' | 'milestone' | 'invoice';
  data: NotificationData;
  timestamp: Date;
}

export interface LocalNotification {
  id: number;
  message: string;
  type: NotificationType;
  data?: NotificationData | DashboardUpdate;
  timestamp: Date;
  read: boolean;
}

export interface NotificationServiceCallbacks {
  onNotification?: (notification: Notification) => void;
  onNotificationUpdate?: (update: NotificationUpdate) => void;
  onUnreadCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
  onDashboardUpdate?: (update: DashboardUpdate) => void;
  onStatsUpdated?: (data: NotificationData) => void;
  onRealtimeNotification?: (notification: LocalNotification) => void;
}

export class NotificationService {
  public socket: Socket | null = null;
  public dashboardSocket: Socket | null = null;
  public callbacks: NotificationServiceCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = parseInt(
    import.meta.env.MAX_RECONNECT_ATTEMPTS || '5'
  );
  private reconnectDelay = parseInt(import.meta.env.RECONNECT_DELAY || '1000');
  public notificationQueue: LocalNotification[] = [];
  private isVisible = true;

  constructor() {
    // Only connect on client-side
    if (typeof window !== 'undefined') {
      this.isVisible = !document.hidden;
      this.setupVisibilityChange();
      this.connect();
      this.connectDashboard();
    }
  }

  private setupVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;

      if (this.isVisible && this.notificationQueue.length > 0) {
        this.processNotificationQueue();
      }
    });
  }

  private connect() {
    // Only connect on client-side
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      // No auth token found, skipping notification connection
      return;
    }

    const apiConfig = {
      apiConfig: {
        baseUrl:
          import.meta.env.PUBLIC_API_URL ||
          (import.meta.env.MODE === 'production'
            ? 'https://api.jasaweb.com'
            : 'http://localhost:3000'),
      },
    };
    const apiUrl = apiConfig.apiConfig.baseUrl;

    this.socket = io(`${apiUrl}/notifications`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: parseInt(import.meta.env.NOTIFICATION_TIMEOUT || '20000'),
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private connectDashboard() {
    // Only connect on client-side
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    const apiConfig = {
      apiConfig: {
        baseUrl:
          import.meta.env.PUBLIC_API_URL ||
          (import.meta.env.MODE === 'production'
            ? 'https://api.jasaweb.com'
            : 'http://localhost:3000'),
      },
    };
    const apiUrl = apiConfig.apiConfig.baseUrl;

    this.dashboardSocket = io(`${apiUrl}/dashboard`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: parseInt(import.meta.env.NOTIFICATION_TIMEOUT || '20000'),
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupDashboardEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Connected to notification service
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', (_reason: unknown) => {
      // Disconnected from notification service
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (error: unknown) => {
      // Notification connection error
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Max reconnection attempts reached
        this.callbacks.onError?.(error as Error | Record<string, unknown>);
      }

      this.callbacks.onError?.(error);
    });

    this.socket.on('notification', (notification: Notification) => {
      // Received notification
      this.callbacks.onNotification?.(notification);

      // Show browser notification if permission granted
      this.showBrowserNotification(notification);
    });

    this.socket.on('notification-update', (update: NotificationUpdate) => {
      // Received notification update
      this.callbacks.onNotificationUpdate?.(update);
    });

    this.socket.on('unread-count', (data: { count: number }) => {
      // Unread count updated
      this.callbacks.onUnreadCount?.(data.count);
    });

    this.socket.on('error', (error: unknown) => {
      // Socket error
      this.callbacks.onError?.(error);
    });
  }

  private setupDashboardEventListeners() {
    if (!this.dashboardSocket) return;

    this.dashboardSocket.on('connect', () => {
      logger.debug('Connected to dashboard WebSocket');
      this.callbacks.onConnect?.();

      // Subscribe to dashboard updates
      const organizationId = localStorage.getItem('organization_id');
      if (organizationId && this.dashboardSocket) {
        this.dashboardSocket.emit('subscribe-dashboard', { organizationId });
      }
    });

    this.dashboardSocket.on('disconnect', (reason: unknown) => {
      logger.warn('Disconnected from dashboard WebSocket', { reason });
      this.callbacks.onDisconnect?.();
    });

    this.dashboardSocket.on('connect_error', (error: unknown) => {
      logger.error(
        'Dashboard WebSocket connection error',
        error as Error | Record<string, unknown>
      );
      this.callbacks.onError?.(error as Error | Record<string, unknown>);
    });

    this.dashboardSocket.on('initial-data', (data: NotificationData) => {
      logger.debug('Received initial dashboard data', data);
      // Dispatch custom event for dashboard components
      window.dispatchEvent(
        new CustomEvent('dashboard-initial-data', { detail: data })
      );
    });

    this.dashboardSocket.on('stats-updated', (data: NotificationData) => {
      logger.debug('Stats updated', data);
      this.callbacks.onStatsUpdated?.(data);

      // Dispatch custom event for dashboard components
      window.dispatchEvent(new CustomEvent('stats-updated', { detail: data }));

      // Show real-time notification
      this.showRealtimeNotification('Dashboard stats updated', 'success');
    });

    this.dashboardSocket.on('dashboard-update', (update: DashboardUpdate) => {
      logger.debug(
        'Dashboard update',
        update as unknown as Record<string, unknown>
      );
      this.callbacks.onDashboardUpdate?.(update);

      // Dispatch custom event for dashboard components
      window.dispatchEvent(
        new CustomEvent('dashboard-update', { detail: update })
      );

      // Show contextual notification
      this.showRealtimeNotification(
        `${update.type.charAt(0).toUpperCase() + update.type.slice(1)} updated`,
        'info',
        update
      );
    });

    this.dashboardSocket.on('personal-update', (data: DashboardUpdate) => {
      logger.debug(
        'Personal update',
        data as unknown as Record<string, unknown>
      );

      // Show personal notification
      this.showRealtimeNotification(
        `You have a new ${data.type} update`,
        'personal',
        data
      );
    });

    this.dashboardSocket.on('error', (error: unknown) => {
      logger.error(
        'Dashboard WebSocket error',
        error as Error | Record<string, unknown>
      );
      this.callbacks.onError?.(error as Error | Record<string, unknown>);
      this.showRealtimeNotification('Connection error', 'error');
    });
  }

  private showBrowserNotification(notification: Notification) {
    // Only show notifications on client-side
    if (typeof window === 'undefined') {
      return;
    }

    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.showBrowserNotification(notification);
        }
      });
    }
  }

  // Public methods
  public on(callbacks: NotificationServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public off(callbacks: Partial<NotificationServiceCallbacks>) {
    Object.keys(callbacks).forEach((key) => {
      delete this.callbacks[key as keyof NotificationServiceCallbacks];
    });
  }

  public markAsRead(notificationId: string) {
    if (typeof window === 'undefined' || !this.socket) return;
    this.socket.emit('mark-read', { notificationId });
  }

  public markAllAsRead() {
    if (typeof window === 'undefined' || !this.socket) return;
    this.socket.emit('mark-all-read');
  }

  public getUnreadCount() {
    if (typeof window === 'undefined' || !this.socket) return;
    this.socket.emit('get-unread-count');
  }

  // Real-time notification methods
  public showRealtimeNotification(
    message: string,
    type: NotificationType = 'info',
    data?: NotificationData | DashboardUpdate
  ) {
    const notification: LocalNotification = {
      id: Date.now() + Math.random(),
      message,
      type,
      data,
      timestamp: new Date(),
      read: false,
    };

    this.callbacks.onRealtimeNotification?.(notification);

    if (this.isVisible) {
      this.displayNotification(notification);
    } else {
      this.notificationQueue.push(notification);
    }

    // Also dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent('realtime-notification', {
        detail: notification,
      })
    );
  }

  private displayNotification(notification: LocalNotification) {
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;

    // Set color based on type
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
      personal: 'bg-purple-500',
    };

    notificationEl.classList.add(colors[notification.type] || colors.info);

    notificationEl.innerHTML = `
      <div class="flex items-center space-x-3 text-white">
        <div class="flex-shrink-0">
          ${this.getNotificationIcon(notification.type)}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${notification.message}</p>
          ${notification.data ? `<p class="text-xs opacity-75 mt-1">${this.getNotificationDetails(notification.data)}</p>` : ''}
        </div>
        <button class="flex-shrink-0 ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notificationEl);

    // Animate in
    setTimeout(() => {
      notificationEl.classList.remove('translate-x-full');
      notificationEl.classList.add('translate-x-0');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notificationEl.parentElement) {
        notificationEl.classList.add('translate-x-full');
        setTimeout(() => notificationEl.remove(), 300);
      }
    }, 5000);
  }

  private getNotificationIcon(type: string) {
    const icons: Record<string, string> = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
      personal: '<i class="fas fa-user-circle"></i>',
    };

    return icons[type] || icons.info;
  }

  private getNotificationDetails(data: NotificationData | DashboardUpdate) {
    if (!data) return '';

    // Check if data matches DashboardUpdate structure with 'type' field
    if ('type' in data && typeof data.type === 'string') {
      const update = data as DashboardUpdate;
      const payload = update.data as Record<string, unknown>; // Assuming data.data is the payload

      switch (update.type) {
        case 'project':
          return `Project: ${payload?.name || 'Unknown'}`;
        case 'ticket':
          return `Ticket: ${payload?.title || 'Unknown'}`;
        case 'milestone':
          return `Milestone: ${payload?.title || 'Unknown'}`;
        case 'invoice':
          return `Invoice: ${payload?.id || 'Unknown'}`;
        default:
          return '';
      }
    }

    return '';
  }

  public processNotificationQueue() {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        this.displayNotification(notification);
      }
    }
  }

  // Dashboard-specific methods
  public refreshDashboardStats() {
    if (this.dashboardSocket && this.dashboardSocket.connected) {
      const organizationId = localStorage.getItem('organization_id');
      if (organizationId) {
        this.dashboardSocket.emit('refresh-stats', { organizationId });
      }
    }
  }

  public subscribeToDashboard(organizationId: string) {
    if (this.dashboardSocket && this.dashboardSocket.connected) {
      this.dashboardSocket.emit('subscribe-dashboard', { organizationId });
    }
  }

  public unsubscribeFromDashboard(organizationId: string) {
    if (this.dashboardSocket && this.dashboardSocket.connected) {
      this.dashboardSocket.emit('unsubscribe-dashboard', { organizationId });
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.dashboardSocket) {
      this.dashboardSocket.disconnect();
      this.dashboardSocket = null;
    }
  }

  public reconnect() {
    this.disconnect();
    this.connect();
    this.connectDashboard();
  }

  public isConnected(): boolean {
    return (
      (this.socket?.connected || false) &&
      (this.dashboardSocket?.connected || false)
    );
  }

  public getDashboardConnectionStatus() {
    return {
      connected: this.dashboardSocket?.connected || false,
      socketId: this.dashboardSocket?.id,
    };
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Request browser notification permission on load
if (
  typeof window !== 'undefined' &&
  'Notification' in window &&
  Notification.permission === 'default'
) {
  Notification.requestPermission();
}
