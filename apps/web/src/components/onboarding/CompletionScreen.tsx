import React from 'react';

interface CompletionScreenProps {
  organizationName: string;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  organizationName,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Congratulations!
      </h2>
      <p className="text-xl text-gray-600 mb-6">
        You've successfully completed the onboarding for{' '}
        <strong>{organizationName}</strong>
      </p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          What's Next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Explore Your Dashboard
              </h4>
              <p className="text-sm text-gray-600">
                Get an overview of your projects and activity
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Create Your First Project
              </h4>
              <p className="text-sm text-gray-600">
                Start building your dream website
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Invite Team Members</h4>
              <p className="text-sm text-gray-600">
                Collaborate with your team effectively
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Check Out Resources</h4>
              <p className="text-sm text-gray-600">
                Access tutorials and best practices
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/portal"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Go to Dashboard
        </a>
        <a
          href="/portal/projects/new"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
        >
          Create Project
        </a>
        <a
          href="/help"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
        >
          Get Help
        </a>
      </div>
    </div>
  );
};
