import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import MilestoneTimeline from './MilestoneTimeline';
import TaskBoard from './TaskBoard';
import FileManager from './FileManager';
import ApprovalWorkflow from './ApprovalWorkflow';

interface ProjectManagementHubProps {
  projectId: string;
  activeTab: string;
  onStatsUpdate?: () => void;
}

export default function ProjectManagementHub({
  projectId,
  activeTab,
  onStatsUpdate,
}: ProjectManagementHubProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Loading...</p>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'milestones':
        return (
          <MilestoneTimeline
            projectId={projectId}
            onMilestoneUpdate={onStatsUpdate}
          />
        );
      case 'tasks':
        return <TaskBoard projectId={projectId} onTaskUpdate={onStatsUpdate} />;
      case 'files':
        return (
          <FileManager projectId={projectId} onFileUpdate={onStatsUpdate} />
        );
      case 'approvals':
        return (
          <ApprovalWorkflow
            projectId={projectId}
            onApprovalUpdate={onStatsUpdate}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a tab to view content</p>
          </div>
        );
    }
  };

  return <div className="w-full">{renderActiveComponent()}</div>;
}

// Function to initialize the React component in the Astro page
export function initializeProjectManagement(projectId: string) {
  // Find the container elements
  const milestonesContainer = document.getElementById('milestones-root');
  const tasksContainer = document.getElementById('tasks-root');
  const filesContainer = document.getElementById('files-root');
  const approvalsContainer = document.getElementById('approvals-root');

  // Function to render component in a container
  const renderComponent = (container: HTMLElement | null, tabName: string) => {
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create a root and render the component
    const root = createRoot(container);
    root.render(
      <ProjectManagementHub
        projectId={projectId}
        activeTab={tabName}
        onStatsUpdate={() => {
          // Trigger stats refresh when components update
          const event = new CustomEvent('projectStatsUpdate');
          document.dispatchEvent(event);
        }}
      />
    );
  };

  // Expose render functions to global scope for the Astro page
  (window as any).renderMilestonesTab = () =>
    renderComponent(milestonesContainer, 'milestones');
  (window as any).renderTasksTab = () =>
    renderComponent(tasksContainer, 'tasks');
  (window as any).renderFilesTab = () =>
    renderComponent(filesContainer, 'files');
  (window as any).renderApprovalsTab = () =>
    renderComponent(approvalsContainer, 'approvals');
}

// Type declarations for global window
declare global {
  interface Window {
    renderMilestonesTab?: () => void;
    renderTasksTab?: () => void;
    renderFilesTab?: () => void;
    renderApprovalsTab?: () => void;
  }
}
