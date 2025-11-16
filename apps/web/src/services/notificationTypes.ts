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
