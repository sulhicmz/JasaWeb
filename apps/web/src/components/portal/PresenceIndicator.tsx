import React, { useState, useEffect } from 'react';
import {
  collaborationService,
  CollaborationUser,
  ProjectParticipant,
} from '../services/collaborationService';

interface PresenceIndicatorProps {
  projectId?: string;
  showOnlineUsers?: boolean;
  showProjectParticipants?: boolean;
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  projectId,
  showOnlineUsers = true,
  showProjectParticipants = true,
  className = '',
}) => {
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [projectParticipants, setProjectParticipants] = useState<
    ProjectParticipant[]
  >([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize connection
    const token = localStorage.getItem('token');
    if (token) {
      collaborationService.connect(token).then(() => {
        setConnected(true);
        loadInitialData();
      });
    }

    // Set up event listeners
    const handleUserOnline = (user: CollaborationUser) => {
      setOnlineUsers((prev) => [...prev.filter((u) => u.id !== user.id), user]);
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
    };

    const handleUserJoinedProject = (data: {
      projectId: string;
      user: CollaborationUser;
    }) => {
      if (data.projectId === projectId) {
        setProjectParticipants((prev) => [
          ...prev,
          {
            userId: data.user.id,
            userName: data.user.name,
            joinedAt: new Date(),
          },
        ]);
      }
    };

    const handleUserLeftProject = (data: {
      projectId: string;
      userId: string;
    }) => {
      if (data.projectId === projectId) {
        setProjectParticipants((prev) =>
          prev.filter((p) => p.userId !== data.userId)
        );
      }
    };

    const handleCursorUpdate = (data: {
      userId: string;
      userName: string;
      position: { x: number; y: number };
      documentId?: string;
    }) => {
      if (projectId) {
        setProjectParticipants((prev) =>
          prev.map((p) =>
            p.userId === data.userId
              ? {
                  ...p,
                  cursor: { ...data.position, documentId: data.documentId },
                }
              : p
          )
        );
      }
    };

    const handleUserTyping = (data: {
      userId: string;
      userName: string;
      documentId?: string;
      isTyping: boolean;
    }) => {
      if (projectId) {
        setProjectParticipants((prev) =>
          prev.map((p) =>
            p.userId === data.userId
              ? {
                  ...p,
                  isTyping: data.isTyping,
                  typingDocumentId: data.documentId,
                }
              : p
          )
        );
      }
    };

    // Register event listeners
    collaborationService.on('user_online', handleUserOnline);
    collaborationService.on('user_offline', handleUserOffline);
    collaborationService.on('user_joined_project', handleUserJoinedProject);
    collaborationService.on('user_left_project', handleUserLeftProject);
    collaborationService.on('cursor_update', handleCursorUpdate);
    collaborationService.on('user_typing', handleUserTyping);

    // Cleanup
    return () => {
      collaborationService.off('user_online', handleUserOnline);
      collaborationService.off('user_offline', handleUserOffline);
      collaborationService.off('user_joined_project', handleUserJoinedProject);
      collaborationService.off('user_left_project', handleUserLeftProject);
      collaborationService.off('cursor_update', handleCursorUpdate);
      collaborationService.off('user_typing', handleUserTyping);
    };
  }, [projectId]);

  useEffect(() => {
    if (connected && projectId) {
      collaborationService.joinProject(projectId);
    }

    return () => {
      if (projectId) {
        collaborationService.leaveProject(projectId);
      }
    };
  }, [connected, projectId]);

  const loadInitialData = async () => {
    try {
      // Load online users
      if (showOnlineUsers) {
        const users = await collaborationService.getOnlineUsers();
        setOnlineUsers(users);
      }

      // Load project participants
      if (showProjectParticipants && projectId) {
        const participants =
          await collaborationService.getProjectParticipants(projectId);
        setProjectParticipants(participants);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserStatusColor = (user: CollaborationUser | ProjectParticipant) => {
    if ('isOnline' in user) {
      return user.isOnline ? 'bg-green-500' : 'bg-gray-400';
    }
    return 'bg-green-500'; // Project participants are online by definition
  };

  return (
    <div className={`presence-indicator ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center mb-4">
        <div
          className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="text-sm text-gray-600">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Online Users */}
      {showOnlineUsers && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Online Users ({onlineUsers.length})
          </h3>
          <div className="space-y-2">
            {onlineUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {getUserInitials(user.name || user.email)}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getUserStatusColor(user)}`}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <p className="text-xs text-gray-500">
                +{onlineUsers.length - 5} more users online
              </p>
            )}
          </div>
        </div>
      )}

      {/* Project Participants */}
      {showProjectParticipants && projectId && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            In Project ({projectParticipants.length})
          </h3>
          <div className="space-y-2">
            {projectParticipants.map((participant) => (
              <div key={participant.userId} className="flex items-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {getUserInitials(participant.userName)}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getUserStatusColor(participant)}`}
                  />
                  {participant.isTyping && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {participant.userName}
                    {participant.isTyping && (
                      <span className="ml-2 text-xs text-yellow-600">
                        typing...
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.cursor ? 'Viewing document' : 'In project'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
