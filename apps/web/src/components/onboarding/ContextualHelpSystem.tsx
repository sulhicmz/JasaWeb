import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  position = 'top',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 -mt-1';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 -ml-1';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 -mr-1';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 -mt-1';
    }
  };

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div className="cursor-help" onClick={() => setIsVisible(!isVisible)}>
        {children}
      </div>

      {isVisible && (
        <>
          <div
            ref={tooltipRef}
            className={`absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg ${getPositionClasses()}`}
          >
            <div className="flex items-start justify-between">
              <p className="flex-1">{content}</p>
              <button
                onClick={() => setIsVisible(false)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${getArrowClasses()}`}
            />
          </div>
        </>
      )}
    </div>
  );
};

interface HelpButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export const HelpButton: React.FC<HelpButtonProps> = ({
  onClick,
  isActive = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
};

interface ContextualHelpSystemProps {
  helpTopics: {
    id: string;
    title: string;
    content: string;
    selector?: string;
  }[];
  isActive: boolean;
  onToggle: () => void;
}

export const ContextualHelpSystem: React.FC<ContextualHelpSystemProps> = ({
  helpTopics,
  isActive,
  onToggle,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [highlightedElements, setHighlightedElements] = useState<HTMLElement[]>(
    []
  );

  useEffect(() => {
    if (isActive && selectedTopic) {
      const topic = helpTopics.find((t) => t.id === selectedTopic);
      if (topic?.selector) {
        // Clear previous highlights
        highlightedElements.forEach((el) => {
          el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        });

        // Add new highlights
        const elements = document.querySelectorAll(topic.selector);
        const newHighlights = Array.from(elements) as HTMLElement[];
        newHighlights.forEach((el) => {
          el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        });
        setHighlightedElements(newHighlights);

        // Scroll to first highlighted element
        if (newHighlights.length > 0) {
          newHighlights[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    } else {
      // Clear all highlights
      highlightedElements.forEach((el) => {
        el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      });
      setHighlightedElements([]);
    }

    return () => {
      // Cleanup on unmount
      highlightedElements.forEach((el) => {
        el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      });
    };
  }, [isActive, selectedTopic, helpTopics]);

  if (!isActive) {
    return <HelpButton onClick={onToggle} />;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">Help Center</h3>
        <button
          onClick={() => {
            onToggle();
            setSelectedTopic(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Help Topics */}
      <div className="max-h-96 overflow-y-auto">
        {selectedTopic ? (
          <div className="p-4">
            <button
              onClick={() => setSelectedTopic(null)}
              className="mb-3 text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              ← Back to topics
            </button>
            <h4 className="font-medium text-gray-900 mb-2">
              {helpTopics.find((t) => t.id === selectedTopic)?.title}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {helpTopics.find((t) => t.id === selectedTopic)?.content}
            </p>
          </div>
        ) : (
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">How can we help?</h4>
            <div className="space-y-2">
              {helpTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {topic.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Need more help?</span>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
