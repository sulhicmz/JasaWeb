import React, { useState, useEffect } from 'react';
import {
  ProjectAnalyticsDashboard,
  OrganizationAnalyticsDashboard,
} from './AnalyticsDashboard';

interface AnalyticsPageProps {
  projectId?: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ projectId }) => {
  const [view, setView] = useState<'project' | 'organization'>('project');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time insights and predictive analytics for your projects
          </p>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setView('project')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  view === 'project'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Project Analytics
              </button>
              <button
                onClick={() => setView('organization')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  view === 'organization'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Organization Overview
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Content */}
        {view === 'project' ? (
          projectId ? (
            <ProjectAnalyticsDashboard projectId={projectId} />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Project Selected
              </h3>
              <p className="text-gray-500">
                Please select a project to view detailed analytics.
              </p>
            </div>
          )
        ) : (
          <OrganizationAnalyticsDashboard />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
