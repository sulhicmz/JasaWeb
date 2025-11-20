import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Maximize2,
  MessageSquare,
  FileText,
  Settings,
} from 'lucide-react';

interface TourHighlight {
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const DashboardTourStep: React.FC = () => {
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [showElement, setShowElement] = useState(true);

  const tourHighlights: TourHighlight[] = [
    {
      selector: '.dashboard-header',
      title: 'Dashboard Header',
      description:
        'Your main navigation and user profile. Access all sections from here.',
      position: 'bottom',
    },
    {
      selector: '.quick-actions',
      title: 'Quick Actions',
      description: 'Common tasks you can perform with a single click.',
      position: 'bottom',
    },
    {
      selector: '.status-widgets',
      title: 'Status Overview',
      description: 'At-a-glance view of your project statistics and progress.',
      position: 'left',
    },
    {
      selector: '.project-overview',
      title: 'Project Management',
      description: 'View and manage all your active projects in detail.',
      position: 'right',
    },
    {
      selector: '.activity-feed',
      title: 'Activity Feed',
      description:
        'Real-time updates on all project activities and team actions.',
      position: 'left',
    },
  ];

  const currentHighlight = tourHighlights[activeHighlight];

  const nextHighlight = () => {
    if (activeHighlight < tourHighlights.length - 1) {
      setActiveHighlight((prev) => prev + 1);
    }
  };

  const prevHighlight = () => {
    if (activeHighlight > 0) {
      setActiveHighlight((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tour Instructions */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Eye className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Interactive Dashboard Tour
        </h3>
        <p className="text-gray-600 mb-4">
          Let's explore the key features of your dashboard. Click through the
          highlights below to understand each section.
        </p>
      </div>

      {/* Interactive Dashboard Mock */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {/* Mock Dashboard Header */}
          <div className="dashboard-header flex items-center justify-between mb-6 p-3 bg-blue-50 rounded border-2 border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
              <span className="font-medium">JasaWeb Portal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
              <span className="text-sm">John Doe</span>
            </div>
          </div>

          {/* Mock Quick Actions */}
          <div className="quick-actions grid grid-cols-4 gap-3 mb-6">
            {[
              'New Project',
              'Upload File',
              'Create Ticket',
              'View Reports',
            ].map((action, i) => (
              <div
                key={i}
                className="p-3 bg-green-50 rounded border-2 border-green-200 text-center text-sm"
              >
                {action}
              </div>
            ))}
          </div>

          {/* Mock Status Widgets */}
          <div className="status-widgets grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Active Projects', value: '3', color: 'blue' },
              { label: 'Pending Approvals', value: '2', color: 'yellow' },
              { label: 'Completed Tasks', value: '15', color: 'green' },
            ].map((widget, i) => (
              <div
                key={i}
                className={`p-4 bg-${widget.color}-50 rounded border-2 border-${widget.color}-200`}
              >
                <div className={`text-2xl font-bold text-${widget.color}-600`}>
                  {widget.value}
                </div>
                <div className="text-sm text-gray-600">{widget.label}</div>
              </div>
            ))}
          </div>

          {/* Mock Main Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Project Overview */}
            <div className="project-overview col-span-2 p-4 bg-orange-50 rounded border-2 border-orange-200">
              <h4 className="font-medium mb-3">Recent Projects</h4>
              <div className="space-y-2">
                {['Company Website', 'E-commerce Platform', 'News Portal'].map(
                  (project, i) => (
                    <div key={i} className="p-2 bg-white rounded border">
                      {project}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="activity-feed p-4 bg-purple-50 rounded border-2 border-purple-200">
              <h4 className="font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-white rounded">New design uploaded</div>
                <div className="p-2 bg-white rounded">
                  Project milestone completed
                </div>
                <div className="p-2 bg-white rounded">Comment added</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            Step {activeHighlight + 1} of {tourHighlights.length}:{' '}
            {currentHighlight.title}
          </h4>
          <button
            onClick={() => setShowElement(!showElement)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showElement ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="text-gray-600 mb-4">{currentHighlight.description}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={prevHighlight}
            disabled={activeHighlight === 0}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {tourHighlights.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === activeHighlight ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextHighlight}
            disabled={activeHighlight === tourHighlights.length - 1}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <FileText className="h-5 w-5" />, label: 'Projects' },
          { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages' },
          { icon: <Settings className="h-5 w-5" />, label: 'Settings' },
          { icon: <Maximize2 className="h-5 w-5" />, label: 'Reports' },
        ].map((feature, i) => (
          <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-center text-gray-600 mb-2">
              {feature.icon}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {feature.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
