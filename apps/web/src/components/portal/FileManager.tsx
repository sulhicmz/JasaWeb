import React, { useState, useEffect, useRef } from 'react';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  folderId?: string;
  uploadedBy: string;
  uploadedAt: string;
  projectId: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  projectId: string;
}

interface FileManagerProps {
  projectId: string;
  onFileUpdate?: () => void;
}

export default function FileManager({
  projectId,
  onFileUpdate,
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFilesAndFolders();
  }, [projectId, currentFolder]);

  const loadFilesAndFolders = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockFiles: FileItem[] = [
        {
          id: '1',
          name: 'logo-design.png',
          size: 245760,
          type: 'image/png',
          url: '/files/logo-design.png',
          folderId: currentFolder,
          uploadedBy: 'John Doe',
          uploadedAt: '2024-12-10T10:30:00Z',
          projectId,
        },
        {
          id: '2',
          name: 'project-brief.pdf',
          size: 524288,
          type: 'application/pdf',
          url: '/files/project-brief.pdf',
          folderId: currentFolder,
          uploadedBy: 'Jane Smith',
          uploadedAt: '2024-12-08T14:15:00Z',
          projectId,
        },
        {
          id: '3',
          name: 'homepage-mockup.fig',
          size: 1048576,
          type: 'application/figma',
          url: '/files/homepage-mockup.fig',
          folderId: null,
          uploadedBy: 'John Doe',
          uploadedAt: '2024-12-05T09:00:00Z',
          projectId,
        },
      ];

      const mockFolders: Folder[] = [
        {
          id: 'folder1',
          name: 'Design Assets',
          parentId: null,
          createdAt: '2024-12-01T10:00:00Z',
          projectId,
        },
        {
          id: 'folder2',
          name: 'Documentation',
          parentId: null,
          createdAt: '2024-12-02T11:00:00Z',
          projectId,
        },
      ];

      setFiles(mockFiles.filter((file) => file.folderId === currentFolder));
      setFolders(
        mockFolders.filter((folder) => folder.parentId === currentFolder)
      );
      setError(null);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (uploadedFiles: FileList) => {
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        // Mock upload - replace with actual implementation
        const newFile: FileItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          folderId: currentFolder,
          uploadedBy: 'Current User',
          uploadedAt: new Date().toISOString(),
          projectId,
        };

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return newFile;
      });

      const newFiles = await Promise.all(uploadPromises);
      setFiles([...files, ...newFiles]);
      onFileUpdate?.();
    } catch (err) {
      setError('Failed to upload files');
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async (folderName: string) => {
    try {
      const newFolder: Folder = {
        id: Date.now().toString(),
        name: folderName,
        parentId: currentFolder,
        createdAt: new Date().toISOString(),
        projectId,
      };

      setFolders([...folders, newFolder]);
      setShowCreateFolderModal(false);
      onFileUpdate?.();
    } catch (err) {
      setError('Failed to create folder');
      console.error('Error creating folder:', err);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setFiles(files.filter((file) => file.id !== fileId));
      onFileUpdate?.();
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this folder and all its contents?'
      )
    ) {
      return;
    }

    try {
      setFolders(folders.filter((folder) => folder.id !== folderId));
      // Also delete files in this folder
      setFiles(files.filter((file) => file.folderId !== folderId));
      onFileUpdate?.();
    } catch (err) {
      setError('Failed to delete folder');
      console.error('Error deleting folder:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation'))
      return '📈';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    if (type.includes('figma')) return '🎨';
    return '📎';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
    setSelectedFiles([]);
  };

  const getCurrentPath = () => {
    const path = [];
    let currentId = currentFolder;

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId || null;
      } else {
        break;
      }
    }

    return path;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">File Manager</h3>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigateToFolder(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Root
            </button>
            {getCurrentPath().map((folder, index) => (
              <React.Fragment key={folder.id}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
          >
            New Folder
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-gray-400 mb-2">
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="text-gray-600">
          Drag and drop files here, or click to browse
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Folders</h4>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-4 gap-4'
                : 'space-y-2'
            }
          >
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                viewMode={viewMode}
                onClick={() => navigateToFolder(folder.id)}
                onDelete={() => deleteFolder(folder.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Files</h4>
        {files.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
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
            <p className="text-gray-500">No files in this folder</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-4 gap-4'
                : 'space-y-2'
            }
          >
            {files.map((file) => (
              <FileItemComponent
                key={file.id}
                file={file}
                viewMode={viewMode}
                onDelete={() => deleteFile(file.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedFiles([...selectedFiles, file.id]);
                  } else {
                    setSelectedFiles(
                      selectedFiles.filter((id) => id !== file.id)
                    );
                  }
                }}
                selected={selectedFiles.includes(file.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <CreateFolderModal
          onCreate={createFolder}
          onCancel={() => setShowCreateFolderModal(false)}
        />
      )}
    </div>
  );
}

interface FolderItemProps {
  folder: Folder;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onDelete: () => void;
}

function FolderItem({ folder, viewMode, onClick, onDelete }: FolderItemProps) {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'grid') {
    return (
      <div
        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer relative"
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="text-4xl mb-2 text-center">📁</div>
        <div className="text-sm font-medium text-gray-900 text-center truncate">
          {folder.name}
        </div>

        {showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 text-red-600 hover:text-red-800"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">📁</span>
        <span className="font-medium text-gray-900">{folder.name}</span>
      </div>

      {showActions && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-600 hover:text-red-800"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

interface FileItemComponentProps {
  file: FileItem;
  viewMode: 'grid' | 'list';
  onDelete: () => void;
  onSelect: (selected: boolean) => void;
  selected: boolean;
}

function FileItemComponent({
  file,
  viewMode,
  onDelete,
  onSelect,
  selected,
}: FileItemComponentProps) {
  const [showActions, setShowActions] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation'))
      return '📈';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    if (type.includes('figma')) return '🎨';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (viewMode === 'grid') {
    return (
      <div
        className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer relative ${
          selected ? 'ring-2 ring-indigo-500' : ''
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="text-center mb-2">
          <div className="text-4xl mb-2">{getFileIcon(file.type)}</div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </div>
          <div className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />

          {showActions && (
            <div className="flex space-x-1">
              <button
                onClick={() => window.open(file.url, '_blank')}
                className="text-indigo-600 hover:text-indigo-800"
                title="Download"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800"
                title="Delete"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow flex items-center justify-between ${
        selected ? 'ring-2 ring-indigo-500' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-xl">{getFileIcon(file.type)}</span>
        <div>
          <div className="font-medium text-gray-900">{file.name}</div>
          <div className="text-sm text-gray-500">
            {formatFileSize(file.size)} • {file.uploadedBy} •{' '}
            {new Date(file.uploadedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-2">
          <button
            onClick={() => window.open(file.url, '_blank')}
            className="text-indigo-600 hover:text-indigo-800"
            title="Download"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

interface CreateFolderModalProps {
  onCreate: (name: string) => void;
  onCancel: () => void;
}

function CreateFolderModal({ onCreate, onCancel }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    try {
      await onCreate(folderName.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Create New Folder
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folder Name *
            </label>
            <input
              type="text"
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
