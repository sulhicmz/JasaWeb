import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

const MobileNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setNotifications([
          {
            id: '1',
            title: 'Project Update',
            message:
              'Company Website design phase has been completed and is ready for review.',
            type: 'success',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            read: false,
            actionUrl: '/portal/projects/1',
            actionText: 'View Project',
          },
          {
            id: '2',
            title: 'New Comment',
            message: 'John Doe commented on your E-commerce Platform project.',
            type: 'info',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
            actionUrl: '/portal/projects/2',
            actionText: 'View Comment',
          },
          {
            id: '3',
            title: 'Approval Required',
            message: 'Mobile App Design mockups are ready for your approval.',
            type: 'warning',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            read: false,
            actionUrl: '/portal/approvals/3',
            actionText: 'Review Now',
          },
          {
            id: '4',
            title: 'File Uploaded',
            message:
              'Sarah Wilson uploaded 3 new files to News Portal project.',
            type: 'info',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            read: true,
            actionUrl: '/portal/projects/4/files',
            actionText: 'View Files',
          },
          {
            id: '5',
            title: 'Project Completed',
            message: 'Portfolio Website project has been marked as completed.',
            type: 'success',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            read: true,
            actionUrl: '/portal/projects/5',
            actionText: 'View Project',
          },
        ]);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle text-green-600';
      case 'warning':
        return 'fa-exclamation-triangle text-yellow-600';
      case 'error':
        return 'fa-times-circle text-red-600';
      default:
        return 'fa-info-circle text-blue-600';
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-4 shadow-sm animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              {
                key: 'read',
                label: 'Read',
                count: notifications.length - unreadCount,
              },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={markAllAsRead}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              <i className="fas fa-check-double mr-2"></i>
              Mark all as read
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-lg shadow-sm border transition-all ${
              notification.read
                ? 'border-gray-100 opacity-75'
                : 'border-gray-200'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Notification Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationBg(
                    notification.type
                  )}`}
                >
                  <i
                    className={`fas ${getNotificationIcon(notification.type)} text-sm`}
                  ></i>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3
                      className={`text-sm font-medium text-gray-900 ${
                        !notification.read ? 'font-semibold' : ''
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Delete notification"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </span>

                    {/* Action Button */}
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 font-medium hover:text-blue-700"
                      >
                        {notification.actionText}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Unread Indicator */}
              {!notification.read && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-check mr-1"></i>
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-bell-slash text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'unread'
              ? 'No unread notifications'
              : 'No notifications'}
          </h3>
          <p className="text-sm text-gray-600">
            {filter === 'unread'
              ? 'All caught up! Check back later for new updates.'
              : 'Notifications about your projects will appear here.'}
          </p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Notification Settings
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Project Updates', enabled: true },
              { label: 'Comments', enabled: true },
              { label: 'Approvals', enabled: true },
              { label: 'File Uploads', enabled: false },
            ].map((setting, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{setting.label}</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNotifications;
