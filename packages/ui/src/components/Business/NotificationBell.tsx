import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationBellProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  className?: string;
}

const typeConfig = {
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
  success: {
    icon: '✅',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
  },
  error: {
    icon: '❌',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
  },
};

export function NotificationBell({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick?.(notification);
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    setIsOpen(false);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
      >
        <BellIcon className="h-5 w-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const config = typeConfig[notification.type];

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                        !notification.read && 'bg-blue-50'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <span className="text-lg">{config.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  notification.read
                                    ? 'text-gray-900'
                                    : 'text-gray-900'
                                )}
                              >
                                {notification.title}
                              </p>
                              <p
                                className={cn(
                                  'text-sm mt-1',
                                  notification.read
                                    ? 'text-gray-600'
                                    : 'text-gray-700'
                                )}
                              >
                                {notification.message}
                              </p>

                              {notification.action && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.action!.onClick();
                                  }}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {notification.action.label}
                                </button>
                              )}
                            </div>

                            <div className="flex items-center ml-2 space-x-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead?.(notification.id);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-800 rounded"
                                >
                                  <CheckIcon className="h-3 w-3" />
                                </button>
                              )}
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Notification Toast Component
export interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function NotificationToast({
  notification,
  onClose,
  autoClose = true,
  duration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[notification.type];

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <span className="text-lg">{config.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
