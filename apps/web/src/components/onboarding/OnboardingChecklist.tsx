import React from 'react';
import { Check, Circle, Lock, Play } from 'lucide-react';

interface OnboardingStep {
  stepKey: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  dependsOn: string[];
  config?: Record<string, any>;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  completedSteps: string[];
  skippedSteps: string[];
  currentStep: string;
  onStepClick: (stepKey: string) => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  steps,
  completedSteps,
  skippedSteps,
  currentStep,
  onStepClick,
}) => {
  const getStepStatus = (step: OnboardingStep) => {
    if (completedSteps.includes(step.stepKey)) return 'completed';
    if (skippedSteps.includes(step.stepKey)) return 'skipped';
    if (step.stepKey === currentStep) return 'current';
    if (
      step.dependsOn.some(
        (dep) => !completedSteps.includes(dep) && !skippedSteps.includes(dep)
      )
    ) {
      return 'locked';
    }
    return 'available';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'skipped':
        return (
          <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
        );
      case 'current':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'skipped':
        return 'bg-gray-50 border-gray-200';
      case 'current':
        return 'bg-blue-50 border-blue-200 ring-2 ring-blue-500';
      case 'locked':
        return 'bg-gray-50 border-gray-200 opacity-60';
      default:
        return 'bg-white border-gray-200 hover:border-gray-300';
    }
  };

  const isStepClickable = (status: string) => {
    return status === 'available' || status === 'current';
  };

  const progress =
    (completedSteps.length / steps.filter((s) => s.isRequired).length) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Onboarding Progress
        </h3>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {completedSteps.length} of {steps.filter((s) => s.isRequired).length}{' '}
          required steps completed
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const status = getStepStatus(step);
          const isClickable = isStepClickable(status);

          return (
            <div
              key={step.stepKey}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${getStepStyles(
                status
              )} ${isClickable ? 'hover:shadow-sm' : ''}`}
              onClick={() => isClickable && onStepClick(step.stepKey)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {step.title}
                    </h4>
                    {step.isRequired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>

                  {status === 'locked' && step.dependsOn.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Requires: {step.dependsOn.join(', ')}
                    </p>
                  )}

                  {status === 'completed' && (
                    <p className="text-xs text-green-600 mt-2">Completed</p>
                  )}

                  {status === 'skipped' && (
                    <p className="text-xs text-gray-500 mt-2">Skipped</p>
                  )}

                  {status === 'current' && (
                    <p className="text-xs text-blue-600 mt-2">In progress</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    Step {step.order}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-gray-600">Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span className="text-gray-600">Available</span>
            </div>
          </div>

          {completedSteps.length ===
            steps.filter((s) => s.isRequired).length && (
            <span className="text-green-600 font-medium">🎉 All done!</span>
          )}
        </div>
      </div>
    </div>
  );
};
