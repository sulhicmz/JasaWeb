import React, { useState, useEffect } from 'react';
import { OnboardingWizard } from './OnboardingWizard';
import { WelcomeStep } from './WelcomeStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { DashboardTourStep } from './DashboardTourStep';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: React.ReactNode;
  required: boolean;
  order: number;
}

interface OnboardingManagerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingManager: React.FC<OnboardingManagerProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState({
    status: 'not_started',
    completedSteps: [],
    totalSteps: 0,
    progressPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // API base URL
  const API_BASE_URL = 'http://localhost:3001';

  useEffect(() => {
    if (isOpen) {
      loadOnboardingData();
    }
  }, [isOpen, userId]);

  const loadOnboardingData = async () => {
    try {
      setIsLoading(true);

      // Load onboarding steps and progress
      const [stepsResponse, progressResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/onboarding/steps`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
        fetch(`${API_BASE_URL}/onboarding/progress`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
      ]);

      if (stepsResponse.ok && progressResponse.ok) {
        const stepsData = await stepsResponse.json();
        const progressData = await progressResponse.json();

        // Map steps to include React components
        const stepsWithComponents = stepsData.map((step: OnboardingStep) => ({
          ...step,
          component: getStepComponent(step.id),
        }));

        setSteps(stepsWithComponents);
        setCurrentStep(progressData.currentStep);
        setProgress({
          status: progressData.status,
          completedSteps: progressData.completedSteps,
          totalSteps: progressData.totalSteps,
          progressPercentage: progressData.progressPercentage,
        });
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepComponent = (stepId: string): React.ReactNode => {
    switch (stepId) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile_setup':
        return <ProfileSetupStep />;
      case 'dashboard_tour':
        return <DashboardTourStep />;
      default:
        return null;
    }
  };

  const handleStepComplete = async (stepId: string, completed: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/step`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ stepId, completed }),
      });

      if (response.ok) {
        const updatedProgress = await response.json();
        setCurrentStep(updatedProgress.currentStep);
        setProgress({
          ...progress,
          completedSteps: updatedProgress.completedSteps,
          progressPercentage: updatedProgress.progressPercentage,
        });
      }
    } catch (error) {
      console.error('Failed to update step progress:', error);
    }
  };

  const handleStartOnboarding = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        loadOnboardingData(); // Reload data to get updated progress
      }
    } catch (error) {
      console.error('Failed to start onboarding:', error);
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/skip`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const handleCompleteOnboarding = () => {
    onClose();
    // Optionally show a completion message or redirect
    showCompletionMessage();
  };

  const showCompletionMessage = () => {
    // Create a temporary success message
    const message = document.createElement('div');
    message.className =
      'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    message.textContent =
      'Congratulations! You have completed the onboarding process.';
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 5000);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  // Show start onboarding prompt if not started
  if (progress.status === 'not_started') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to JasaWeb!
            </h2>
            <p className="text-gray-600 mb-6">
              Let's take a few minutes to walk through the key features of your
              client portal. This will help you get the most out of your project
              management experience.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleStartOnboarding}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Tour
              </button>
              <button
                onClick={handleSkipOnboarding}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWizard
      isOpen={isOpen}
      onClose={onClose}
      onComplete={handleCompleteOnboarding}
      steps={steps}
      currentStep={currentStep}
      onStepComplete={handleStepComplete}
      onSkip={handleSkipOnboarding}
    />
  );
};
