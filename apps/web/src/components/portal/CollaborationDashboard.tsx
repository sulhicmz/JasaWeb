import React, { useState, useEffect } from 'react';
import { PresenceIndicator } from './PresenceIndicator';
import { Chat } from './Chat';
import { DocumentEditor } from './DocumentEditor';
import { collaborationService } from '../../services/collaborationService';

interface CollaborationDashboardProps {
  projectId: string;
  className?: string;
}

interface Document {
  id: string;
  title: string;
  version: number;
  lastEdited: Date;
  lastEditedBy: string;
}

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({
  projectId,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'editor'>(
    'chat'
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [projectState, setProjectState] = useState<any>(null);

  useEffect(() => {
    initializeCollaboration();
    loadProjectData();
  }, [projectId]);

  const initializeCollaboration = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const connected = await collaborationService.connect(token);
        setIsConnected(connected);

        if (connected) {
          await collaborationService.joinProject(projectId);
        }
      }
    } catch (error) {
      console.error('Error initializing collaboration:', error);
    }
  };

  const loadProjectData = async () => {
    try {
      const state = await collaborationService.getProjectState(projectId);
      if (state) {
        setProjectState(state);
        setDocuments(state.documents || []);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setActiveTab('editor');
  };

  const handleCreateDocument = async () => {
    try {
      // This would create a new document via API
      const newDocument: Document = {
        id: `doc_${Date.now()}`,
        title: `New Document ${documents.length + 1}`,
        version: 1,
        lastEdited: new Date(),
        lastEditedBy: 'current-user',
      };

      setDocuments((prev) => [newDocument, ...prev]);
      setSelectedDocument(newDocument);
      setActiveTab('editor');
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const formatLastEdited = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`collaboration-dashboard ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Presence Indicator */}
          <PresenceIndicator
            projectId={projectId}
            showOnlineUsers={true}
            showProjectParticipants={true}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          />

          {/* Recent Activity */}
          {projectState?.recentActivity && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {projectState.recentActivity
                  .slice(0, 5)
                  .map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {activity.userName}
                          </span>{' '}
                          {activity.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatLastEdited(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`py-3 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'chat'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`py-3 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'documents'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Documents ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`py-3 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'editor'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={!selectedDocument}
                >
                  {selectedDocument ? selectedDocument.title : 'Editor'}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'chat' && <Chat projectId={projectId} />}

              {activeTab === 'documents' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Project Documents
                    </h3>
                    <button
                      onClick={handleCreateDocument}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      New Document
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg
                          className="mx-auto h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No documents yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Create your first document to start collaborating.
                      </p>
                      <button
                        onClick={handleCreateDocument}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Create Document
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleDocumentSelect(doc)}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {doc.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Version {doc.version} • Edited{' '}
                                {formatLastEdited(doc.lastEdited)}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                by {doc.lastEditedBy}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'editor' && selectedDocument && (
                <DocumentEditor
                  projectId={projectId}
                  documentId={selectedDocument.id}
                  initialContent=""
                />
              )}

              {activeTab === 'editor' && !selectedDocument && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No document selected
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Select a document from the Documents tab to start editing.
                  </p>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Browse Documents
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
