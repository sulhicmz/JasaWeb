import React, { useEffect } from 'react';
import { useOnboarding } from '../onboarding';

export const OnboardingStatusWidget: React.FC = () => {
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return null; // Don't show widget if there's an error or no state
  }

  const requiredSteps = steps.filter((s) => s.isRequired);
  const progress = (state.completedSteps.length / requiredSteps.length) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Onboarding</h3>
        {state.isCompleted ? (
          <span className="text-green-600 text-sm font-medium">
            ✅ Complete
          </span>
        ) : (
          <span className="text-blue-600 text-sm font-medium">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            state.isCompleted ? 'bg-green-600' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {state.isCompleted ? (
          <span className="text-green-600">All set! You're ready to go.</span>
        ) : (
          `${state.completedSteps.length} of ${requiredSteps.length} steps completed`
        )}
      </div>

      {/* Action Button */}
      {!state.isCompleted && (
        <button
          onClick={showOnboardingWizard}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {state.completedSteps.length === 0
            ? 'Start Onboarding'
            : 'Continue Onboarding'}
        </button>
      )}

      {state.isCompleted && (
        <div className="text-center">
          <a
            href="/onboarding"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Review Onboarding
          </a>
        </div>
      )}
    </div>
  );
};
