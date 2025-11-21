import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';

interface OnboardingState {
  id: string;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  isCompleted: boolean;
  preferences: Record<string, any>;
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
}

interface OnboardingStep {
  stepKey: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  dependsOn: string[];
  config?: Record<string, any>;
}

interface OnboardingContextType {
  state: OnboardingState | null;
  steps: OnboardingStep[];
  isLoading: boolean;
  error: string | null;
  showWizard: boolean;
  showTour: boolean;
  fetchOnboardingState: () => Promise<void>;
  completeStep: (stepKey: string, data?: any) => Promise<void>;
  skipStep: (stepKey: string) => Promise<void>;
  updateState: (updates: Partial<OnboardingState>) => Promise<void>;
  showOnboardingWizard: () => void;
  hideOnboardingWizard: () => void;
  startProductTour: () => void;
  endProductTour: () => void;
}

type OnboardingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATE'; payload: OnboardingState }
  | { type: 'SET_STEPS'; payload: OnboardingStep[] }
  | { type: 'SHOW_WIZARD' }
  | { type: 'HIDE_WIZARD' }
  | { type: 'SHOW_TOUR' }
  | { type: 'HIDE_TOUR' }
  | { type: 'UPDATE_STATE'; payload: Partial<OnboardingState> };

const initialState = {
  state: null,
  steps: [],
  isLoading: false,
  error: null,
  showWizard: false,
  showTour: false,
};

function onboardingReducer(state: any, action: OnboardingAction) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_STATE':
      return { ...state, state: action.payload, isLoading: false };
    case 'SET_STEPS':
      return { ...state, steps: action.payload };
    case 'SHOW_WIZARD':
      return { ...state, showWizard: true };
    case 'HIDE_WIZARD':
      return { ...state, showWizard: false };
    case 'SHOW_TOUR':
      return { ...state, showTour: true };
    case 'HIDE_TOUR':
      return { ...state, showTour: false };
    case 'UPDATE_STATE':
      return {
        ...state,
        state: state.state ? { ...state.state, ...action.payload } : null,
      };
    default:
      return state;
  }
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // API base URL - adjust this based on your environment
  const API_BASE =
    process.env.NODE_ENV === 'production'
      ? '/api'
      : 'http://localhost:3001/api';

  const fetchOnboardingState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Get auth token from localStorage or cookies
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/onboarding/state`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding state');
      }

      const onboardingState = await response.json();
      dispatch({ type: 'SET_STATE', payload: onboardingState });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const fetchSteps = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/onboarding/steps`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const steps = await response.json();
        dispatch({ type: 'SET_STEPS', payload: steps });
      }
    } catch (error) {
      console.error('Failed to fetch onboarding steps:', error);
    }
  };

  const completeStep = async (stepKey: string, data?: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/onboarding/complete-step`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stepKey, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      const updatedState = await response.json();
      dispatch({ type: 'SET_STATE', payload: updatedState });

      // If this is the last step, hide the wizard
      if (updatedState.isCompleted) {
        dispatch({ type: 'HIDE_WIZARD' });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const skipStep = async (stepKey: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE}/onboarding/skip-step/${stepKey}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to skip step');
      }

      const updatedState = await response.json();
      dispatch({ type: 'SET_STATE', payload: updatedState });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const updateState = async (updates: Partial<OnboardingState>) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/onboarding/state`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update onboarding state');
      }

      const updatedState = await response.json();
      dispatch({ type: 'SET_STATE', payload: updatedState });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const showOnboardingWizard = () => {
    dispatch({ type: 'SHOW_WIZARD' });
  };

  const hideOnboardingWizard = () => {
    dispatch({ type: 'HIDE_WIZARD' });
  };

  const startProductTour = () => {
    dispatch({ type: 'SHOW_TOUR' });
  };

  const endProductTour = () => {
    dispatch({ type: 'HIDE_TOUR' });
  };

  // Initialize onboarding data
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchOnboardingState();
      fetchSteps();
    }
  }, []);

  const value: OnboardingContextType = {
    state: state.state,
    steps: state.steps,
    isLoading: state.isLoading,
    error: state.error,
    showWizard: state.showWizard,
    showTour: state.showTour,
    fetchOnboardingState,
    completeStep,
    skipStep,
    updateState,
    showOnboardingWizard,
    hideOnboardingWizard,
    startProductTour,
    endProductTour,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
