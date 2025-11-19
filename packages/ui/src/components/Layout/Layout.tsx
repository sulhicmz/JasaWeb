import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
  children?: SidebarItem[];
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

export function Sidebar({
  items,
  collapsed = false,
  onCollapse,
  className,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderSidebarItems = (items: SidebarItem[], level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.id);

      return (
        <div key={item.id}>
          <a
            href={item.href || '#'}
            className={cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              item.active
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              collapsed && 'justify-center'
            )}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
                toggleExpanded(item.id);
              }
            }}
          >
            {item.icon && (
              <span className={cn('flex-shrink-0', !collapsed && 'mr-3')}>
                {item.icon}
              </span>
            )}
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {hasChildren && (
                  <svg
                    className={cn(
                      'ml-2 h-4 w-4 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </>
            )}
          </a>

          {hasChildren && !collapsed && isExpanded && (
            <div className="mt-1 ml-4">
              {renderSidebarItems(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        )}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          {collapsed ? (
            <Bars3Icon className="h-5 w-5" />
          ) : (
            <XMarkIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {renderSidebarItems(items)}
      </nav>
    </div>
  );
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  className?: string;
}

export function Header({
  title,
  subtitle,
  actions,
  user,
  onMenuToggle,
  showMenuButton = false,
  className,
}: HeaderProps) {
  return (
    <header className={cn('bg-white border-b border-gray-200', className)}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}
            <div>
              {title && (
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              )}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {actions}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {user.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function Layout({ children, sidebar, header, className }: LayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {header}
      <div className="flex">
        {sidebar}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: number;
  className?: string;
}

export function Grid({ children, cols = 1, gap = 4, className }: GridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12',
  };

  return (
    <div className={cn('grid', gridCols[cols], `gap-${gap}`, className)}>
      {children}
    </div>
  );
}

export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Container({
  children,
  size = 'lg',
  className,
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
