import React from 'react';

interface CurrentStepScreenProps {
  currentStep: any;
  completedSteps: string[];
  totalSteps: number;
}

export const CurrentStepScreen: React.FC<CurrentStepScreenProps> = ({
  currentStep,
  completedSteps,
  totalSteps,
}) => {
  const progress = (completedSteps.length / totalSteps) * 100;

  if (!currentStep) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Continue?
        </h2>
        <p className="text-gray-600 mb-6">
          Click "Show Wizard" above to continue your onboarding journey.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentStep.title}
          </h2>
          <span className="text-sm text-gray-500">
            Step {currentStep.order} of {totalSteps}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completedSteps.length} of {totalSteps} steps completed
        </p>
      </div>

      {/* Step Content */}
      <div className="prose max-w-none">
        <p className="text-lg text-gray-700 mb-6">{currentStep.description}</p>

        {currentStep.config && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Step Details
            </h3>
            <div className="space-y-2">
              {currentStep.config.estimatedTime && (
                <p className="text-blue-800">
                  <strong>Estimated Time:</strong>{' '}
                  {currentStep.config.estimatedTime}
                </p>
              )}
              {currentStep.isRequired && (
                <p className="text-blue-800">
                  <strong>Status:</strong> Required step
                </p>
              )}
              {currentStep.dependsOn.length > 0 && (
                <p className="text-blue-800">
                  <strong>Prerequisites:</strong>{' '}
                  {currentStep.dependsOn.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() =>
            document.querySelector('[data-onboarding-wizard-trigger]')?.click()
          }
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          data-onboarding-wizard-trigger
        >
          Complete This Step
        </button>
      </div>
    </div>
  );
};
