import React from 'react';
import {
  CheckCircle,
  Users,
  FileText,
  MessageSquare,
  Settings,
} from 'lucide-react';

export const WelcomeStep: React.FC = () => {
  const features = [
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: 'Project Management',
      description:
        'Track milestones, view progress, and manage your website development projects.',
    },
    {
      icon: <Users className="h-6 w-6 text-green-600" />,
      title: 'Team Collaboration',
      description:
        'Work closely with our team through real-time updates and feedback.',
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-purple-600" />,
      title: 'Approval Workflows',
      description:
        'Review and approve designs, content, and features with ease.',
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-orange-600" />,
      title: '24/7 Support',
      description: 'Get help whenever you need it through our ticket system.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center py-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Welcome to Your Client Portal!
        </h3>
        <p className="text-gray-600">
          We're excited to work with you on your website project. This portal
          will be your central hub for tracking progress, collaborating with our
          team, and managing all aspects of your project.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-shrink-0">{feature.icon}</div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Getting Started Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete your profile to help us know you better</li>
              <li>• Take a quick tour of your dashboard</li>
              <li>• Explore your project timeline and milestones</li>
              <li>• Reach out anytime through the support system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
