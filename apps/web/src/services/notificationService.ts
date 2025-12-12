import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
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
  data: any;
  timestamp: Date;
}

export interface NotificationServiceCallbacks {
  onNotification?: (notification: Notification) => void;
  onNotificationUpdate?: (update: NotificationUpdate) => void;
  onUnreadCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onDashboardUpdate?: (update: DashboardUpdate) => void;
  onStatsUpdated?: (data: any) => void;
  onRealtimeNotification?: (notification: any) => void;
}

class NotificationService {
  private socket: any | null = null;
  private dashboardSocket: any | null = null;
  private callbacks: NotificationServiceCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private notificationQueue: any[] = [];
  private isVisible = true;

  constructor() {
    // Only connect on client-side
    if (typeof window !== 'undefined') {
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

    const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

    this.socket = io(`${apiUrl}/notifications`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
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

    const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

    this.dashboardSocket = io(`${apiUrl}/dashboard`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
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

    this.socket.on('disconnect', (reason: any) => {
      // Disconnected from notification service
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (error: any) => {
      // Notification connection error
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Max reconnection attempts reached
        this.callbacks.onError?.(error);
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

    this.socket.on('error', (error: any) => {
      // Socket error
      this.callbacks.onError?.(error);
    });
  }

  private setupDashboardEventListeners() {
    if (!this.dashboardSocket) return;

    this.dashboardSocket.on('connect', () => {
      console.log('Connected to dashboard WebSocket');
      this.callbacks.onConnect?.();

      // Subscribe to dashboard updates
      const organizationId = localStorage.getItem('organization_id');
      if (organizationId) {
        this.dashboardSocket.emit('subscribe-dashboard', { organizationId });
      }
    });

    this.dashboardSocket.on('disconnect', (reason: any) => {
      console.log('Disconnected from dashboard WebSocket:', reason);
      this.callbacks.onDisconnect?.();
    });

    this.dashboardSocket.on('connect_error', (error: any) => {
      console.error('Dashboard WebSocket connection error:', error);
      this.callbacks.onError?.(error);
    });

    this.dashboardSocket.on('initial-data', (data: any) => {
      console.log('Received initial dashboard data:', data);
      // Dispatch custom event for dashboard components
      window.dispatchEvent(
        new CustomEvent('dashboard-initial-data', { detail: data })
      );
    });

    this.dashboardSocket.on('stats-updated', (data: any) => {
      console.log('Stats updated:', data);
      this.callbacks.onStatsUpdated?.(data);

      // Dispatch custom event for dashboard components
      window.dispatchEvent(new CustomEvent('stats-updated', { detail: data }));

      // Show real-time notification
      this.showRealtimeNotification('Dashboard stats updated', 'success');
    });

    this.dashboardSocket.on('dashboard-update', (update: DashboardUpdate) => {
      console.log('Dashboard update:', update);
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

    this.dashboardSocket.on('personal-update', (data: any) => {
      console.log('Personal update:', data);

      // Show personal notification
      this.showRealtimeNotification(
        `You have a new ${data.type} update`,
        'personal',
        data
      );
    });

    this.dashboardSocket.on('error', (error: any) => {
      console.error('Dashboard WebSocket error:', error);
      this.callbacks.onError?.(error);
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
  on(callbacks: NotificationServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  off(callbacks: Partial<NotificationServiceCallbacks>) {
    Object.keys(callbacks).forEach((key) => {
      delete this.callbacks[key as keyof NotificationServiceCallbacks];
    });
  }

  markAsRead(notificationId: string) {
    if (typeof window === 'undefined' || !this.socket) return;
    this.socket.emit('mark-read', { notificationId });
  }

  markAllAsRead() {
    if (typeof window === 'undefined' || !this.socket) return;
    this.socket.emit('mark-all-read');
  }

  getUnreadCount() {
    if (typeof window === 'undefined' || !this.socket) return;
    this.socket.emit('get-unread-count');
  }

  // Real-time notification methods
  private showRealtimeNotification(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'personal' = 'info',
    data?: any
  ) {
    const notification = {
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

  private displayNotification(notification: any) {
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
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
      personal: '<i class="fas fa-user-circle"></i>',
    };

    return icons[type] || icons.info;
  }

  private getNotificationDetails(data: any) {
    if (!data) return '';

    switch (data.type) {
      case 'project':
        return `Project: ${data.data?.name || 'Unknown'}`;
      case 'ticket':
        return `Ticket: ${data.data?.title || 'Unknown'}`;
      case 'milestone':
        return `Milestone: ${data.data?.title || 'Unknown'}`;
      case 'invoice':
        return `Invoice: ${data.data?.id || 'Unknown'}`;
      default:
        return '';
    }
  }

  private processNotificationQueue() {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      this.displayNotification(notification);
    }
  }

  // Dashboard-specific methods
  refreshDashboardStats() {
    if (this.dashboardSocket && this.dashboardSocket.connected) {
      const organizationId = localStorage.getItem('organization_id');
      if (organizationId) {
        this.dashboardSocket.emit('refresh-stats', { organizationId });
      }
    }
  }

  subscribeToDashboard(organizationId: string) {
    if (this.dashboardSocket && this.dashboardSocket.connected) {
      this.dashboardSocket.emit('subscribe-dashboard', { organizationId });
    }
  }

  unsubscribeFromDashboard(organizationId: string) {
    if (this.dashboardSocket && this.dashboardSocket.connected) {
      this.dashboardSocket.emit('unsubscribe-dashboard', { organizationId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.dashboardSocket) {
      this.dashboardSocket.disconnect();
      this.dashboardSocket = null;
    }
  }

  reconnect() {
    this.disconnect();
    this.connect();
    this.connectDashboard();
  }

  isConnected(): boolean {
    return (
      (this.socket?.connected || false) &&
      (this.dashboardSocket?.connected || false)
    );
  }

  getDashboardConnectionStatus() {
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
