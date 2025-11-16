import React, { useEffect } from 'react';
import { useOnboarding } from '../onboarding';

export const OnboardingStatusComponent: React.FC = () => {
  const {
    state,
    steps,
    isLoading,
    error,
    fetchOnboardingState,
    showOnboardingWizard,
  } = useOnboarding();

  useEffect(() => {
    fetchOnboardingState();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !state) {
    return null; // Don't show anything if there's an error or no state
  }

  const progress =
    (state.completedSteps.length / steps.filter((s) => s.isRequired).length) *
    100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Onboarding Progress
        </h3>
        {!state.isCompleted && (
          <button
            onClick={showOnboardingWizard}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Continue Onboarding
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {state.isCompleted ? (
          <span className="text-green-600 font-medium">
            ✅ Onboarding Complete!
          </span>
        ) : (
          `${state.completedSteps.length} of ${steps.filter((s) => s.isRequired).length} steps completed`
        )}
      </p>

      {/* Quick Actions */}
      <div className="flex space-x-3">
        <a
          href="/onboarding"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Details
        </a>
        {!state.isCompleted && (
          <>
            <span className="text-gray-300">•</span>
            <button
              onClick={showOnboardingWizard}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Resume
            </button>
          </>
        )}
      </div>
    </div>
  );
};
