import React from 'react';
import { DashboardHeader } from '../components/portal/DashboardHeader';
import { QuickActions } from '../components/portal/QuickActions';
import { StatusWidgets } from '../components/portal/StatusWidgets';
import { ProjectOverview } from '../components/portal/ProjectOverview';
import { ActivityFeed } from '../components/portal/ActivityFeed';

const PortalDashboard: React.FC = () => {
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
      <DashboardHeader currentPage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your projects and activities
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Status Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatusWidgets />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Overview (2/3 width) */}
          <div className="lg:col-span-2">
            <ProjectOverview />
          </div>

          {/* Activity Feed (1/3 width) */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
