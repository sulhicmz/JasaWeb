import { io, type Socket } from 'socket.io-client';
import { apiConfig, notificationConfig } from '../config';

interface NotificationData {
  [key: string]: string | number | boolean;
}

// Enhanced notification type with proper typing
export interface NotificationPayload {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'system';
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationServiceCallbacks {
  onNotification?: (notification: Notification) => void;
  onNotificationUpdate?: (update: NotificationUpdate) => void;
  onUnreadCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: any) => void;
  onDashboardUpdate?: (update: DashboardUpdate) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStatsUpdated?: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRealtimeNotification?: (notification: any) => void;
}

class NotificationService {
  private socket: Socket | null = null;
  private dashboardSocket: Socket | null = null;
  private callbacks: NotificationServiceCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private notificationQueue: any[] = [];
  private isVisible = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences();
    }
  }

  // Initialize WebSocket connection for real-time notifications
  connect() {
    if (this.socket?.connected) return;

    this.socket = io(apiConfig.baseUrl, {
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    });

    this.socket.on('connect', () => {
      // Connected to notification service
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.socket.on('disconnect', (_reason: any) => {
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

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
      this.emit('disconnected');
    });

    this.socket.on('notification', (notification: NotificationPayload) => {
      this.handleIncomingNotification(notification);
    });

    this.socket.on(
      'notifications_batch',
      (notifications: NotificationPayload[]) => {
        notifications.forEach((notification) => {
          this.handleIncomingNotification(notification);
        });
      }
    );
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Handle incoming notifications
  private handleIncomingNotification(payload: NotificationPayload) {
    // Check quiet hours
    if (this.isQuietHours() && payload.priority !== 'urgent') {
      return;
    }

    // Check priority preferences
    if (!this.shouldShowNotification(payload)) {
      return;
    }

    const notification: Notification = {
      ...payload,
      timestamp: new Date(),
      read: false,
    };

    // Add to notifications list
    this.notifications.unshift(notification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Play sound if enabled
    if (this.preferences.sound) {
      this.playNotificationSound(payload.type);
    }

    // Show desktop notification if enabled and permitted
    if (this.preferences.desktop && 'Notification' in window) {
      this.showDesktopNotification(notification);
    }

    // Emit to listeners
    this.emit('notification', notification);
    this.emit('notifications_updated', this.notifications);
  }

  // Check if current time is within quiet hours
  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.preferences.quietHours.start
      .split(':')
      .map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end
      .split(':')
      .map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day (e.g., 22:00 to 08:00 crosses midnight, so this would be false)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Check if notification should be shown based on preferences
  private shouldShowNotification(payload: NotificationPayload): boolean {
    if (!payload.priority || !this.preferences.priorities[payload.priority]) {
      return false;
    }
    return true;
  }

  // Play notification sound
  private playNotificationSound(type: string) {
    try {
      const audio = new Audio(`/sounds/notification-${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio playback errors
      });
    } catch (error) {
      // Ignore audio errors
    }
  }

  // Show desktop notification
  private showDesktopNotification(notification: Notification) {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.createDesktopNotification(notification);
        }
      });
    } else {
      this.createDesktopNotification(notification);
    }
  }

  private createDesktopNotification(notification: Notification) {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
    });

    desktopNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      desktopNotification.close();
    };

    // Auto-close after config timeout unless urgent
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        desktopNotification.close();
      }, notificationConfig.inApp.autoHideDelay);
    }
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Get unread notifications count
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification && !notification.read) {
      notification.read = true;
      this.emit('notification_read', notification);
      this.emit('notifications_updated', this.notifications);
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach((n) => {
      n.read = true;
    });
    this.emit('all_notifications_read');
    this.emit('notifications_updated', this.notifications);
  }

  // Delete notification
  deleteNotification(notificationId: string) {
    const index = this.notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      const deleted = this.notifications.splice(index, 1)[0];
      this.emit('notification_deleted', deleted);
      this.emit('notifications_updated', this.notifications);
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.emit('all_notifications_cleared');
    this.emit('notifications_updated', this.notifications);
  }

  // Get notification preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Update notification preferences
  updatePreferences(preferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
    this.emit('preferences_updated', this.preferences);
  }

  // Save preferences to localStorage
  private savePreferences() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'notification_preferences',
        JSON.stringify(this.preferences)
      );
    }
  }

  // Load preferences from localStorage
  private loadPreferences() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.preferences = { ...this.preferences, ...parsed };
        } catch (error) {
          console.error('Failed to load notification preferences:', error);
        }
      }
    }
  }

  // Event emitter methods
  on(event: string, callback: (data?: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: (data?: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in notification event listener for ${event}:`,
            error
          );
        }
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // Get notification permission status
  getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }
}

export const notificationService = new NotificationService();
export default notificationService;
