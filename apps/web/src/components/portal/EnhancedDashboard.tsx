import React, { useState, useEffect } from 'react';
import DashboardHeader from './DashboardHeader.astro';
import QuickActions from './QuickActions.tsx';
import StatusWidgets from './StatusWidgets.tsx';
import ProjectOverview from './ProjectOverview.tsx';
import ActivityFeed from './ActivityFeed.tsx';
import { OnboardingManager } from '../onboarding/OnboardingManager';
import { WelcomeDashboard } from '../onboarding/WelcomeDashboard';
import { ContextualHelpSystem } from '../onboarding/ContextualHelpSystem';

interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardStats {
  projectCount: number;
  completedTasks: number;
  pendingApprovals: number;
}

const EnhancedDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    projectCount: 0,
    completedTasks: 0,
    pendingApprovals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:3001';

  // Help topics for contextual help
  const helpTopics = [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      content:
        'Your dashboard provides a comprehensive view of all your projects, tasks, and activities. Use this as your central hub for project management.',
      selector: '.dashboard-header',
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      content:
        'Quick actions allow you to perform common tasks with a single click. Create new projects, upload files, or create tickets instantly.',
      selector: '.quick-actions',
    },
    {
      id: 'status-widgets',
      title: 'Status Widgets',
      content:
        'Status widgets show you key metrics at a glance including active projects, pending approvals, and completed tasks.',
      selector: '.status-widgets',
    },
    {
      id: 'project-management',
      title: 'Project Management',
      content:
        'View and manage all your projects here. Track progress, view milestones, and collaborate with your team.',
      selector: '.project-overview',
    },
    {
      id: 'activity-feed',
      title: 'Activity Feed',
      content:
        'Stay updated with real-time activities from your projects and team members. See recent changes, comments, and updates.',
      selector: '.activity-feed',
    },
  ];

  useEffect(() => {
    loadUserData();
    loadOnboardingProgress();
    loadDashboardStats();
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadOnboardingProgress = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/onboarding/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const progress = await response.json();
        setOnboardingProgress(progress);

        // Show onboarding if not completed
        if (
          progress.status === 'not_started' ||
          progress.status === 'in_progress'
        ) {
          setTimeout(() => setShowOnboarding(true), 1000); // Delay to allow page to load
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Mock data for now - in real implementation, this would come from API
      setDashboardStats({
        projectCount: 3,
        completedTasks: 15,
        pendingApprovals: 2,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    // Reload progress to get updated status
    loadOnboardingProgress();
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    // Show completion message
    showCompletionMessage();
    loadOnboardingProgress();
  };

  const showCompletionMessage = () => {
    const message = document.createElement('div');
    message.className =
      'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    message.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        Congratulations! You've completed the onboarding process.
      </div>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 5000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show welcome dashboard for new users
  if (onboardingProgress && onboardingProgress.status === 'not_started') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WelcomeDashboard
            userName={user?.name || 'there'}
            onStartOnboarding={handleStartOnboarding}
            projectCount={dashboardStats.projectCount}
            completedTasks={dashboardStats.completedTasks}
          />
        </div>

        <OnboardingManager
          userId={user?.id || ''}
          isOpen={showOnboarding}
          onClose={handleCloseOnboarding}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Help Button */}
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p class="mt-2 text-gray-600">
              Overview of your projects and activities
            </p>
          </div>

          {/* Help Button */}
          <div className="flex items-center space-x-3">
            {onboardingProgress &&
              onboardingProgress.status === 'in_progress' && (
                <button
                  onClick={handleStartOnboarding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Continue Tour
                </button>
              )}
            <ContextualHelpSystem
              helpTopics={helpTopics}
              isActive={showHelp}
              onToggle={() => setShowHelp(!showHelp)}
            />
          </div>
        </div>

        {/* Onboarding Progress Bar (if in progress) */}
        {onboardingProgress && onboardingProgress.status === 'in_progress' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Onboarding Progress
              </span>
              <span className="text-sm text-blue-700">
                {onboardingProgress.progressPercentage}% Complete
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${onboardingProgress.progressPercentage}%` }}
              />
            </div>
            <div className="mt-2">
              <button
                onClick={handleStartOnboarding}
                className="text-sm text-blue-700 hover:text-blue-800 font-medium"
              >
                Continue where you left off →
              </button>
            </div>
          </div>
        )}

        {/* Standard Dashboard Content */}
        <QuickActions client:load />

        {/* Status Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 status-widgets">
          <StatusWidgets client:load />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Overview (2/3 width) */}
          <div className="lg:col-span-2 project-overview">
            <ProjectOverview client:load />
          </div>

          {/* Activity Feed (1/3 width) */}
          <div className="lg:col-span-1 activity-feed">
            <ActivityFeed client:load />
          </div>
        </div>
      </div>

      {/* Onboarding Manager */}
      <OnboardingManager
        userId={user?.id || ''}
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />
    </div>
  );
};

export default EnhancedDashboard;
