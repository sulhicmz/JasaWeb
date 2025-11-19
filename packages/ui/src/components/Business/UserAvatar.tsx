import React from 'react';
import { cn } from '../../lib/utils';

export interface UserAvatarProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const statusSizeClasses = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  xl: 'h-4 w-4',
};

const statusColors = {
  online: 'bg-green-400',
  offline: 'bg-gray-400',
  away: 'bg-yellow-400',
  busy: 'bg-red-400',
};

export function UserAvatar({
  user,
  size = 'md',
  status = 'offline',
  showStatus = false,
  showName = false,
  showEmail = false,
  className,
  onClick,
}: UserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const content = (
    <div className={cn('flex items-center', className)}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {user.avatar ? (
          <img
            className={cn(
              'rounded-full object-cover',
              sizeClasses[size],
              onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
            )}
            src={user.avatar}
            alt={user.name}
            onClick={onClick}
          />
        ) : (
          <div
            className={cn(
              'rounded-full bg-gray-300 flex items-center justify-center font-medium text-gray-700',
              sizeClasses[size],
              onClick && 'cursor-pointer hover:bg-gray-400 transition-colors'
            )}
            onClick={onClick}
          >
            {initials}
          </div>
        )}

        {/* Status Indicator */}
        {showStatus && (
          <div
            className={cn(
              'absolute -bottom-0 -right-0 rounded-full border-2 border-white',
              statusSizeClasses[size],
              statusColors[status]
            )}
          />
        )}
      </div>

      {/* User Info */}
      {(showName || showEmail) && (
        <div className="ml-3 min-w-0 flex-1">
          {showName && (
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
          )}
          {showEmail && user.email && (
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          )}
        </div>
      )}
    </div>
  );

  return content;
}

export interface UserListProps {
  users: UserAvatarProps['user'][];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  showEmail?: boolean;
  maxVisible?: number;
  className?: string;
}

export function UserList({
  users,
  size = 'sm',
  showStatus = true,
  showEmail = false,
  maxVisible = 5,
  className,
}: UserListProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className={cn('flex items-center', className)}>
      {/* User Avatars */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div key={index} className="relative">
            <UserAvatar
              user={user}
              size={size}
              status="online" // Default to online for list view
              showStatus={showStatus}
              className="ring-2 ring-white"
            />
          </div>
        ))}
      </div>

      {/* Remaining Count */}
      {remainingCount > 0 && (
        <div className="ml-3">
          <span className="text-sm text-gray-500">+{remainingCount} more</span>
        </div>
      )}
    </div>
  );
}

export interface UserStackProps {
  users: UserAvatarProps['user'][];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  vertical?: boolean;
  className?: string;
}

export function UserStack({
  users,
  size = 'sm',
  vertical = false,
  className,
}: UserStackProps) {
  return (
    <div
      className={cn(
        'flex',
        vertical ? 'flex-col space-y-2' : '-space-x-2',
        className
      )}
    >
      {users.map((user, index) => (
        <UserAvatar
          key={index}
          user={user}
          size={size}
          status="online"
          showStatus={true}
          className="ring-2 ring-white"
        />
      ))}
    </div>
  );
}
