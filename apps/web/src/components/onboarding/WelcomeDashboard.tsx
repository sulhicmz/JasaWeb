import React from 'react';
import {
  Clock,
  Target,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
} from 'lucide-react';

interface WelcomeDashboardProps {
  userName: string;
  onStartOnboarding: () => void;
  projectCount?: number;
  completedTasks?: number;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  userName,
  onStartOnboarding,
  projectCount = 0,
  completedTasks = 0,
}) => {
  const quickActions = [
    {
      icon: <Target className="h-5 w-5" />,
      title: 'View Projects',
      description: 'See all your active projects',
      color: 'blue',
      href: '/portal/projects',
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Team Collaboration',
      description: 'Connect with your project team',
      color: 'green',
      href: '/portal/team',
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Approvals',
      description: 'Review pending items',
      color: 'purple',
      href: '/portal/approvals',
    },
    {
      icon: <Play className="h-5 w-5" />,
      title: 'Start Tutorial',
      description: 'Take a guided tour',
      color: 'orange',
      action: 'tutorial',
    },
  ];

  const gettingStartedSteps = [
    { step: 'Complete your profile', completed: false },
    { step: 'Take the dashboard tour', completed: false },
    { step: 'Explore your projects', completed: false },
    { step: 'Set up notifications', completed: false },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to JasaWeb, {userName}! 🎉
          </h1>
          <p className="text-xl mb-6 text-blue-100">
            We're excited to have you on board. Your client portal is ready to
            help you manage your website projects efficiently.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onStartOnboarding}
              className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Quick Tour
            </button>
            <button className="flex items-center px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors">
              <ArrowRight className="h-5 w-5 mr-2" />
              Explore Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">{projectCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Completed Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {completedTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">2.5h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (action.action === 'tutorial') {
                  onStartOnboarding();
                } else {
                  // Navigate to the href
                  window.location.href = action.href;
                }
              }}
            >
              <div
                className={`flex items-center p-2 bg-${action.color}-100 rounded-lg mb-3 text-${action.color}-600`}
              >
                {action.icon}
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started Checklist */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Getting Started Checklist
        </h2>
        <div className="space-y-3">
          {gettingStartedSteps.map((item, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-gray-50 rounded-lg"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  item.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                } flex items-center justify-center`}
              >
                {item.completed && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`ml-3 ${
                  item.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-900'
                }`}
              >
                {item.step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resources and Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Helpful Resources
          </h2>
          <div className="space-y-3">
            {[
              'User Guide and Documentation',
              'Video Tutorials',
              'FAQ Section',
              'Best Practices Guide',
            ].map((resource, index) => (
              <a
                key={index}
                href="#"
                className="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>{resource}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Need Help?
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Contact Support
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Our team is here to help you succeed.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Create Support Ticket
              </button>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Schedule a Call
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Book a 1-on-1 session with your project manager.
              </p>
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                Book Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
