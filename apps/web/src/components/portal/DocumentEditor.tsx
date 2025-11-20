import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collaborationService,
  DocumentOperation,
} from '../../services/collaborationService';

interface DocumentEditorProps {
  projectId: string;
  documentId: string;
  initialContent?: string;
  className?: string;
}

interface RemoteCursor {
  userId: string;
  userName: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  projectId,
  documentId,
  initialContent = '',
  className = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const [version, setVersion] = useState(1);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingOperationsRef = useRef<DocumentOperation[]>([]);

  // Generate a color for each user
  const getUserColor = useCallback((userId: string) => {
    const colors = [
      '#EF4444',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#14B8A6',
      '#F97316',
      '#06B6D4',
      '#84CC16',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  useEffect(() => {
    setupEventListeners();

    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, [projectId, documentId]);

  const setupEventListeners = () => {
    const handleDocumentUpdated = (data: {
      documentId: string;
      operation: DocumentOperation;
      newVersion: number;
      userId: string;
    }) => {
      if (
        data.documentId === documentId &&
        data.userId !== getCurrentUserId()
      ) {
        applyRemoteOperation(data.operation);
        setVersion(data.newVersion);
      }
    };

    const handleCursorUpdate = (data: {
      userId: string;
      userName: string;
      position: { x: number; y: number };
      selection?: { start: number; end: number };
      documentId?: string;
    }) => {
      if (
        data.documentId === documentId &&
        data.userId !== getCurrentUserId()
      ) {
        setRemoteCursors((prev) => {
          const filtered = prev.filter((c) => c.userId !== data.userId);
          return [
            ...filtered,
            {
              userId: data.userId,
              userName: data.userName,
              position: data.selection?.start || 0,
              selection: data.selection,
              color: getUserColor(data.userId),
            },
          ];
        });
      }
    };

    collaborationService.on('document_updated', handleDocumentUpdated);
    collaborationService.on('cursor_update', handleCursorUpdate);

    return () => {
      collaborationService.off('document_updated', handleDocumentUpdated);
      collaborationService.off('cursor_update', handleCursorUpdate);
    };
  };

  const getCurrentUserId = () => {
    // This should get the current user's ID from auth context or localStorage
    return localStorage.getItem('userId') || 'current-user';
  };

  const applyRemoteOperation = (operation: DocumentOperation) => {
    setContent((prevContent) => {
      let newContent = prevContent;

      switch (operation.type) {
        case 'insert':
          newContent =
            newContent.slice(0, operation.position) +
            (operation.content || '') +
            newContent.slice(operation.position);
          break;
        case 'delete':
          newContent =
            newContent.slice(0, operation.position) +
            newContent.slice(operation.position + (operation.length || 0));
          break;
        case 'retain':
          // No change to content
          break;
      }

      return newContent;
    });
  };

  const createOperation = (
    oldContent: string,
    newContent: string
  ): DocumentOperation[] => {
    const operations: DocumentOperation[] = [];
    let i = 0;
    let j = 0;

    while (i < oldContent.length || j < newContent.length) {
      if (
        i < oldContent.length &&
        j < newContent.length &&
        oldContent[i] === newContent[j]
      ) {
        // Characters are the same, retain
        let retainLength = 0;
        while (
          i + retainLength < oldContent.length &&
          j + retainLength < newContent.length &&
          oldContent[i + retainLength] === newContent[j + retainLength]
        ) {
          retainLength++;
        }

        if (retainLength > 0) {
          operations.push({
            type: 'retain',
            position: i,
          });
          i += retainLength;
          j += retainLength;
        }
      } else if (
        j < newContent.length &&
        (i >= oldContent.length || oldContent[i] !== newContent[j])
      ) {
        // Insertion
        let insertContent = '';
        while (
          j < newContent.length &&
          (i >= oldContent.length || oldContent[i] !== newContent[j])
        ) {
          insertContent += newContent[j];
          j++;
        }

        operations.push({
          type: 'insert',
          position: i,
          content: insertContent,
        });
      } else if (
        i < oldContent.length &&
        (j >= newContent.length || oldContent[i] !== newContent[j])
      ) {
        // Deletion
        let deleteLength = 0;
        while (
          i + deleteLength < oldContent.length &&
          (j >= newContent.length ||
            oldContent[i + deleteLength] !== newContent[j])
        ) {
          deleteLength++;
        }

        operations.push({
          type: 'delete',
          position: i,
          length: deleteLength,
        });
        i += deleteLength;
      }
    }

    return operations;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;

    setContent(newContent);
    setIsEditing(true);

    // Clear existing timeout
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }

    // Set new timeout to send operation after 500ms of inactivity
    editTimeoutRef.current = setTimeout(() => {
      sendOperations(oldContent, newContent);
      setIsEditing(false);
    }, 500);
  };

  const sendOperations = (oldContent: string, newContent: string) => {
    const operations = createOperation(oldContent, newContent);

    operations.forEach((operation) => {
      collaborationService.sendDocumentEdit(documentId, operation, version);
    });

    // Update version optimistically
    setVersion((prev) => prev + operations.length);
  };

  const handleSelectionChange = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Send cursor position
    collaborationService.sendCursorMove(
      { x: 0, y: 0 }, // Position would be calculated from textarea coordinates
      documentId,
      start !== end ? { start, end } : undefined
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          // Save document
          break;
        case 'z':
          e.preventDefault();
          // Undo
          break;
        case 'y':
          e.preventDefault();
          // Redo
          break;
      }
    }
  };

  const renderCursors = () => {
    if (!textareaRef.current) return null;

    const textarea = textareaRef.current;
    const cursors: JSX.Element[] = [];

    remoteCursors.forEach((cursor) => {
      if (cursor.selection) {
        // Render selection highlight
        const beforeText = content.slice(0, cursor.selection.start);
        const selectedText = content.slice(
          cursor.selection.start,
          cursor.selection.end
        );

        // Calculate position (simplified)
        const lines = beforeText.split('\n');
        const row = lines.length - 1;
        const col = lines[lines.length - 1].length;

        cursors.push(
          <div
            key={cursor.userId}
            className="absolute pointer-events-none"
            style={{
              top: `${row * 24}px`, // Assuming 24px line height
              left: `${col * 8}px`, // Assuming 8px character width
              backgroundColor: cursor.color,
              opacity: 0.3,
              height: '24px',
              width: `${cursor.selection.end - cursor.selection.start * 8}px`,
            }}
          >
            <div
              className="absolute top-0 right-0 w-0.5 h-full"
              style={{ backgroundColor: cursor.color }}
            />
            <div
              className="absolute -top-6 right-0 px-2 py-1 text-xs text-white rounded"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </div>
          </div>
        );
      }
    });

    return cursors;
  };

  return (
    <div className={`document-editor ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Document Editor
            </h3>
            <p className="text-sm text-gray-500">
              Version {version} • {isConnected ? 'Connected' : 'Disconnected'}
              {isEditing && ' • Editing...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {remoteCursors.map((cursor) => (
              <div
                key={cursor.userId}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: cursor.color + '20',
                  color: cursor.color,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cursor.color }}
                />
                <span>{cursor.userName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onSelect={handleSelectionChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing your document here..."
            className="w-full h-96 px-4 py-3 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm"
            disabled={!isConnected}
          />
          {renderCursors()}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {content.length} characters • {content.split('\n').length} lines
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs ${isEditing ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {isEditing ? 'Saving...' : 'Saved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
