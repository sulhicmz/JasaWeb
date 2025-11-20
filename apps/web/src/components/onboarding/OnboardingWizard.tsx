import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: React.ReactNode;
  required: boolean;
  order: number;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  steps: OnboardingStep[];
  currentStep: number;
  onStepComplete: (stepId: string, completed: boolean) => void;
  onSkip: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  steps,
  currentStep,
  onStepComplete,
  onSkip,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const activeStep = steps[activeStepIndex];
  const isLastStep = activeStepIndex === steps.length - 1;
  const isFirstStep = activeStepIndex === 0;
  const canProceed =
    !activeStep.required || completedSteps.includes(activeStep.id);

  useEffect(() => {
    setActiveStepIndex(currentStep);
  }, [currentStep]);

  const handleNext = () => {
    if (activeStep.required && !completedSteps.includes(activeStep.id)) {
      // Mark current step as complete if it's required
      handleStepComplete(activeStep.id, true);
    }

    if (isLastStep) {
      onComplete();
    } else {
      setActiveStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setActiveStepIndex((prev) => prev - 1);
    }
  };

  const handleStepComplete = (stepId: string, completed: boolean) => {
    if (completed && !completedSteps.includes(stepId)) {
      setCompletedSteps((prev) => [...prev, stepId]);
    } else if (!completed && completedSteps.includes(stepId)) {
      setCompletedSteps((prev) => prev.filter((id) => id !== stepId));
    }
    onStepComplete(stepId, completed);
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  const progress = ((activeStepIndex + 1) / steps.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeStep.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                Step {activeStepIndex + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip onboarding
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 mb-6">{activeStep.description}</p>

            {activeStep.component && (
              <div className="mb-6">{activeStep.component}</div>
            )}

            {/* Step completion checkbox for required steps */}
            {activeStep.required && (
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id={`step-${activeStep.id}`}
                  checked={completedSteps.includes(activeStep.id)}
                  onChange={(e) =>
                    handleStepComplete(activeStep.id, e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`step-${activeStep.id}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  I have completed this step
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              {completedSteps.includes(activeStep.id) && (
                <div className="flex items-center text-green-600 text-sm">
                  <Check className="h-4 w-4 mr-1" />
                  Completed
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLastStep ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
