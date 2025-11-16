import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Info } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when step is shown
}

interface ProductTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  steps,
  isOpen,
  onComplete,
  onSkip,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (isOpen && currentStep) {
      highlightElement(currentStep.target);
      if (currentStep.action) {
        currentStep.action();
      }
    } else {
      removeHighlight();
    }

    return () => removeHighlight();
  }, [isOpen, currentStep]);

  const highlightElement = (selector: string) => {
    removeHighlight();

    const element = document.querySelector(selector);
    if (element) {
      setHighlightedElement(element);

      // Add highlight styles
      element.classList.add('tour-highlight');

      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const tooltipWidth = 350; // Approximate tooltip width
      const tooltipHeight = 200; // Approximate tooltip height

      let top = rect.top;
      let left = rect.left;

      switch (currentStep.position) {
        case 'top':
          top = rect.top - tooltipHeight - 20;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 20;
          break;
        case 'center':
          top = window.innerHeight / 2 - tooltipHeight / 2;
          left = window.innerWidth / 2 - tooltipWidth / 2;
          break;
      }

      // Ensure tooltip stays within viewport
      top = Math.max(
        10,
        Math.min(top, window.innerHeight - tooltipHeight - 10)
      );
      left = Math.max(
        10,
        Math.min(left, window.innerWidth - tooltipWidth - 10)
      );

      setTooltipPosition({ top, left });
    }
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
      setHighlightedElement(null);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    removeHighlight();
    onSkip();
  };

  if (!isOpen || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStep.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-6">{currentStep.content}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <div className="flex space-x-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tour styles */}
      <style jsx>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 4px;
          background-color: rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </>
  );
};

// Default tour steps for the JasaWeb platform
export const defaultTourSteps: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Welcome to Your Dashboard',
    content:
      'This is your command center. Here you can see an overview of all your projects, recent activity, and quick actions.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'projects',
    title: 'Manage Your Projects',
    content:
      'View and manage all your website development projects. Track progress, milestones, and team collaboration.',
    target: '[data-tour="projects"]',
    position: 'right',
  },
  {
    id: 'files',
    title: 'File Management',
    content:
      'Securely share and manage project files. Upload assets, track versions, and collaborate with your team.',
    target: '[data-tour="files"]',
    position: 'left',
  },
  {
    id: 'approvals',
    title: 'Approval Workflow',
    content:
      'Review and approve project deliverables. Keep track of feedback and ensure quality standards.',
    target: '[data-tour="approvals"]',
    position: 'top',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    content:
      'Access frequently used actions and create new projects, upload files, or invite team members.',
    target: '[data-tour="quick-actions"]',
    position: 'center',
  },
];
