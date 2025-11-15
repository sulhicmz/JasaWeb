import React from 'react';
import { DashboardHeader } from '../../components/portal/DashboardHeader';
import { NotificationPreferences } from '../../components/portal/NotificationPreferences';

const PortalSettings: React.FC = () => {
  // Check authentication
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('auth_token');
    if (!isAuthenticated) {
      window.location.href =
        '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="settings" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account and notification preferences
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <a
              href="#notifications"
              className="border-indigo-500 text-indigo-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Notifications
            </a>
            <a
              href="#profile"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Profile
            </a>
            <a
              href="#security"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Security
            </a>
          </nav>
        </div>

        {/* Notification Preferences */}
        <div id="notifications" className="space-y-6">
          <NotificationPreferences />
        </div>

        {/* Other Settings Sections (Placeholder) */}
        <div id="profile" className="hidden space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Settings
            </h2>
            <p className="text-gray-600">Profile management coming soon...</p>
          </div>
        </div>

        <div id="security" className="hidden space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Security Settings
            </h2>
            <p className="text-gray-600">Security management coming soon...</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Script */}
      <script client:load>
        {`
          // Simple tab navigation
          document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
              e.preventDefault();
              const targetId = e.target.getAttribute('href').substring(1);
              
              // Hide all sections
              document.querySelectorAll('[id$="s"]').forEach(section => {
                if (section.id !== 'notifications') {
                  section.classList.add('hidden');
                }
              });
              
              // Show target section
              const targetSection = document.getElementById(targetId);
              if (targetSection) {
                targetSection.classList.remove('hidden');
              }
              
              // Update tab styles
              document.querySelectorAll('nav a').forEach(tab => {
                if (tab.getAttribute('href') === '#' + targetId) {
                  tab.className = 'border-indigo-500 text-indigo-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm';
                } else {
                  tab.className = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm';
                }
              });
            }
          });
        `}
      </script>
    </div>
  );
};

export default PortalSettings;
