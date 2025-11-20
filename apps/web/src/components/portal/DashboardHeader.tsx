import React, { useState } from 'react';
import { NotificationCenter } from './NotificationCenter';

interface DashboardHeaderProps {
  currentPage?: string;
  userName?: string;
  userRole?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentPage = 'dashboard',
  userName = 'John Doe',
  userRole = 'Organization Admin',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/portal',
      current: currentPage === 'dashboard',
    },
    {
      name: 'Projects',
      href: '/portal/projects',
      current: currentPage === 'projects',
    },
    {
      name: 'Analytics',
      href: '/portal/analytics',
      current: currentPage === 'analytics',
    },
    {
      name: 'Team',
      href: '/portal/team-performance',
      current: currentPage === 'team-performance',
    },
    {
      name: 'Tickets',
      href: '/portal/tickets',
      current: currentPage === 'tickets',
    },
    {
      name: 'Invoices',
      href: '/portal/invoices',
      current: currentPage === 'invoices',
    },
    {
      name: 'Settings',
      href: '/portal/settings',
      current: currentPage === 'settings',
    },
  ];

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Portal Name */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-indigo-600">
                JasaWeb Portal
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-900'
                } px-3 py-2 text-sm font-medium transition-colors duration-200`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            <NotificationCenter />

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getUserInitials(userName)}
                </span>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-gray-500 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-indigo-50 text-indigo-700 block px-3 py-2 rounded-md text-base font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
