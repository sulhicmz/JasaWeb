import { io, Socket } from 'socket.io-client';

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

export interface NotificationServiceCallbacks {
  onNotification?: (notification: Notification) => void;
  onNotificationUpdate?: (update: NotificationUpdate) => void;
  onUnreadCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class NotificationService {
  private socket: Socket | null = null;
  private callbacks: NotificationServiceCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    // Only connect on client-side
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    // Only connect on client-side
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found, skipping notification connection');
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

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to notification service');
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from notification service:', reason);
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Notification connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.callbacks.onError?.(error);
      }

      this.callbacks.onError?.(error);
    });

    this.socket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      this.callbacks.onNotification?.(notification);

      // Show browser notification if permission granted
      this.showBrowserNotification(notification);
    });

    this.socket.on('notification-update', (update: NotificationUpdate) => {
      console.log('Received notification update:', update);
      this.callbacks.onNotificationUpdate?.(update);
    });

    this.socket.on('unread-count', (data: { count: number }) => {
      console.log('Unread count updated:', data.count);
      this.callbacks.onUnreadCount?.(data.count);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.callbacks.onError?.(error);
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
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
