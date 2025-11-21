import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, X, SkipForward } from 'lucide-react';

interface OnboardingStep {
  stepKey: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  dependsOn: string[];
  config?: Record<string, any>;
}

interface OnboardingState {
  id: string;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  isCompleted: boolean;
  preferences: Record<string, any>;
}

interface OnboardingWizardProps {
  onboardingState: OnboardingState;
  steps: OnboardingStep[];
  onCompleteStep: (stepKey: string, data?: any) => void;
  onSkipStep: (stepKey: string) => void;
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onboardingState,
  steps,
  onCompleteStep,
  onSkipStep,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});

  const currentStep = steps.find(
    (step) => step.stepKey === onboardingState.currentStep
  );
  const progress =
    (onboardingState.completedSteps.length /
      steps.filter((s) => s.isRequired).length) *
    100;

  useEffect(() => {
    const index = steps.findIndex(
      (step) => step.stepKey === onboardingState.currentStep
    );
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  }, [onboardingState.currentStep, steps]);

  const handleComplete = () => {
    if (currentStep) {
      onCompleteStep(currentStep.stepKey, stepData);
      setStepData({});
    }
  };

  const handleSkip = () => {
    if (currentStep && !currentStep.isRequired) {
      onSkipStep(currentStep.stepKey);
      setStepData({});
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      // This would typically update the current step in the backend
      console.log('Moving to next step:', nextStep.stepKey);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      // This would typically update the current step in the backend
      console.log('Moving to previous step:', prevStep.stepKey);
    }
  };

  if (!currentStep) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold mb-4">Onboarding Complete!</h2>
          <p className="text-gray-600 mb-6">
            Congratulations! You've completed the onboarding process.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">{currentStep.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">{currentStep.description}</p>

          {/* Step-specific content */}
          <StepContent
            step={currentStep}
            data={stepData}
            onChange={setStepData}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
              )}

              {!currentStep.isRequired && (
                <button
                  onClick={handleSkip}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleComplete}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep.stepKey === 'complete' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Finish
                  </>
                ) : (
                  <>
                    Complete
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepContentProps {
  step: OnboardingStep;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const StepContent: React.FC<StepContentProps> = ({ step, data, onChange }) => {
  switch (step.stepKey) {
    case 'welcome':
      return <WelcomeStep data={data} onChange={onChange} />;
    case 'org-setup':
      return <OrgSetupStep data={data} onChange={onChange} />;
    case 'team-invite':
      return <TeamInviteStep data={data} onChange={onChange} />;
    case 'project-create':
      return <ProjectCreateStep data={data} onChange={onChange} />;
    case 'tour':
      return <TourStep data={data} onChange={onChange} />;
    default:
      return <div>Step content not implemented yet.</div>;
  }
};

const WelcomeStep: React.FC<StepContentProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Welcome to JasaWeb! 🎉
        </h3>
        <p className="text-blue-800 mb-4">
          We're excited to help you create amazing websites and manage projects
          efficiently.
        </p>
        <div className="space-y-2 text-sm text-blue-700">
          <p>✓ Professional website development</p>
          <p>✓ Streamlined project management</p>
          <p>✓ Client collaboration tools</p>
          <p>✓ Secure file sharing</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">What to expect:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Set up your organization profile</li>
          <li>• Invite team members (optional)</li>
          <li>• Create your first project</li>
          <li>• Take a quick tour of the platform</li>
        </ul>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={data.termsAccepted || false}
            onChange={(e) =>
              onChange({ ...data, termsAccepted: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I agree to the terms of service and privacy policy
          </span>
        </label>
      </div>
    </div>
  );
};

const OrgSetupStep: React.FC<StepContentProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={(e) => onChange({ ...data, companyName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            value={data.industry || ''}
            onChange={(e) => onChange({ ...data, industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select industry</option>
            <option value="technology">Technology</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="retail">Retail</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={data.timezone || ''}
            onChange={(e) => onChange({ ...data, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select timezone</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Asia/Jakarta">Western Indonesia Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website (optional)
          </label>
          <input
            type="url"
            value={data.website || ''}
            onChange={(e) => onChange({ ...data, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about your company..."
        />
      </div>
    </div>
  );
};

const TeamInviteStep: React.FC<StepContentProps> = ({ data, onChange }) => {
  const [emails, setEmails] = useState<string[]>(data.emails || []);
  const [currentEmail, setCurrentEmail] = useState('');

  const addEmail = () => {
    if (currentEmail && !emails.includes(currentEmail)) {
      const newEmails = [...emails, currentEmail];
      setEmails(newEmails);
      onChange({ ...data, emails: newEmails });
      setCurrentEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const newEmails = emails.filter((email) => email !== emailToRemove);
    setEmails(newEmails);
    onChange({ ...data, emails: newEmails });
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          This step is optional. You can invite team members later from the
          settings page.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite Team Members
        </label>
        <div className="flex space-x-2">
          <input
            type="email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addEmail()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter email address"
          />
          <button
            onClick={addEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {emails.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Invitations to send:
          </h4>
          <div className="space-y-2">
            {emails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
              >
                <span className="text-sm text-gray-700">{email}</span>
                <button
                  onClick={() => removeEmail(email)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectCreateStep: React.FC<StepContentProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Name
        </label>
        <input
          type="text"
          value={data.projectName || ''}
          onChange={(e) => onChange({ ...data, projectName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="My First Project"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: 'website',
              label: 'Website',
              description: 'Company website, portfolio, blog',
            },
            {
              value: 'portal',
              label: 'Portal',
              description: 'Client portal, member area',
            },
            {
              value: 'custom',
              label: 'Custom',
              description: 'Custom web application',
            },
          ].map((type) => (
            <label
              key={type.value}
              className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                data.projectType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="projectType"
                value={type.value}
                checked={data.projectType === type.value}
                onChange={(e) =>
                  onChange({ ...data, projectType: e.target.value })
                }
                className="sr-only"
              />
              <h4 className="font-medium">{type.label}</h4>
              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Description
        </label>
        <textarea
          value={data.projectDescription || ''}
          onChange={(e) =>
            onChange({ ...data, projectDescription: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your project goals and requirements..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Start Date
          </label>
          <input
            type="date"
            value={data.startDate || ''}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Completion Date
          </label>
          <input
            type="date"
            value={data.endDate || ''}
            onChange={(e) => onChange({ ...data, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

const TourStep: React.FC<StepContentProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Ready to explore? 🚀
        </h3>
        <p className="text-green-800 mb-4">
          Take a quick tour to learn about the key features and how to navigate
          the platform.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: 'Dashboard',
            description: 'Overview of your projects and activities',
          },
          {
            title: 'Projects',
            description: 'Manage your website development projects',
          },
          {
            title: 'Files',
            description: 'Share and manage project files securely',
          },
          {
            title: 'Approvals',
            description: 'Review and approve project deliverables',
          },
        ].map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={data.tourAccepted || false}
            onChange={(e) =>
              onChange({ ...data, tourAccepted: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I'm ready to start the interactive tour
          </span>
        </label>
      </div>
    </div>
  );
};
