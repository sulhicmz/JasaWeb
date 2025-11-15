// File Management - Vanilla JavaScript Implementation
class FileManager {
  constructor(projectId, containerId) {
    this.projectId = projectId;
    this.containerId = containerId;
    this.files = [];
    this.folders = [];
    this.currentFolder = null;
    this.loading = false;
    this.error = null;
    this.viewMode = 'grid';
    this.selectedFiles = [];
  }

  async init() {
    await this.loadFilesAndFolders();
    this.render();
  }

  async loadFilesAndFolders() {
    try {
      this.loading = true;
      this.render();

      // Mock data for now - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.files = [
        {
          id: '1',
          name: 'logo-design.png',
          size: 245760,
          type: 'image/png',
          url: '/files/logo-design.png',
          folderId: this.currentFolder,
          uploadedBy: 'John Doe',
          uploadedAt: '2024-12-10T10:30:00Z',
          projectId: this.projectId,
        },
        {
          id: '2',
          name: 'project-brief.pdf',
          size: 524288,
          type: 'application/pdf',
          url: '/files/project-brief.pdf',
          folderId: this.currentFolder,
          uploadedBy: 'Jane Smith',
          uploadedAt: '2024-12-08T14:15:00Z',
          projectId: this.projectId,
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
          projectId: this.projectId,
        },
      ];

      this.folders = [
        {
          id: 'folder1',
          name: 'Design Assets',
          parentId: null,
          createdAt: '2024-12-01T10:00:00Z',
          projectId: this.projectId,
        },
        {
          id: 'folder2',
          name: 'Documentation',
          parentId: null,
          createdAt: '2024-12-02T11:00:00Z',
          projectId: this.projectId,
        },
      ];

      this.error = null;
    } catch (err) {
      this.error = 'Failed to load files';
      console.error('Error loading files:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async uploadFiles(uploadedFiles) {
    if (uploadedFiles.length === 0) return;

    try {
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        // Mock upload - replace with actual implementation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          folderId: this.currentFolder,
          uploadedBy: 'Current User',
          uploadedAt: new Date().toISOString(),
          projectId: this.projectId,
        };

        return newFile;
      });

      const newFiles = await Promise.all(uploadPromises);
      this.files = [...this.files, ...newFiles];
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to upload files';
      console.error('Error uploading files:', err);
      this.render();
    }
  }

  async createFolder(folderName) {
    try {
      const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        parentId: this.currentFolder,
        createdAt: new Date().toISOString(),
        projectId: this.projectId,
      };

      this.folders = [...this.folders, newFolder];
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to create folder';
      console.error('Error creating folder:', err);
      this.render();
    }
  }

  async deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      this.files = this.files.filter((file) => file.id !== fileId);
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to delete file';
      console.error('Error deleting file:', err);
      this.render();
    }
  }

  async deleteFolder(folderId) {
    if (
      !confirm(
        'Are you sure you want to delete this folder and all its contents?'
      )
    ) {
      return;
    }

    try {
      this.folders = this.folders.filter((folder) => folder.id !== folderId);
      this.files = this.files.filter((file) => file.folderId !== folderId);
      this.render();
      this.dispatchUpdateEvent();
    } catch (err) {
      this.error = 'Failed to delete folder';
      console.error('Error deleting folder:', err);
      this.render();
    }
  }

  dispatchUpdateEvent() {
    const event = new CustomEvent('projectStatsUpdate');
    document.dispatchEvent(event);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation'))
      return '📈';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    if (type.includes('figma')) return '🎨';
    return '📎';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  showCreateFolderModal() {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Create New Folder</h3>
        </div>
        <form id="folder-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Folder Name *</label>
            <input type="text" name="folderName" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter folder name" autofocus>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector('#folder-form')
      .addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const folderName = formData.get('folderName');

        await this.createFolder(folderName);
        modal.remove();
      });
  }

  setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.uploadFiles(files);
    });
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.loading) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-500">Loading files...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500 mb-4">${this.error}</div>
          <button onclick="window.fileManager.loadFilesAndFolders()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Try Again</button>
        </div>
      `;
      return;
    }

    const currentFolders = this.folders.filter(
      (folder) => folder.parentId === this.currentFolder
    );
    const currentFiles = this.files.filter(
      (file) => file.folderId === this.currentFolder
    );

    container.innerHTML = `
      <div class="h-full">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center space-x-4">
            <h3 class="text-lg font-medium text-gray-900">File Manager</h3>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.fileManager.showCreateFolderModal()" class="border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50">New Folder</button>
            <button onclick="document.getElementById('file-input').click()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Files</button>
            <input type="file" id="file-input" multiple style="display: none" onchange="window.fileManager.uploadFiles(this.files)">
          </div>
        </div>

        <div id="drop-zone" class="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center hover:border-gray-400 transition-colors">
          <div class="text-gray-400 mb-2">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p class="text-gray-600">Drag and drop files here, or click to browse</p>
        </div>

        ${
          currentFolders.length > 0
            ? `
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Folders</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${currentFolders
                .map(
                  (folder) => `
                <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div class="text-4xl mb-2 text-center">📁</div>
                  <div class="text-sm font-medium text-gray-900 text-center truncate">${folder.name}</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-3">Files</h4>
          ${
            currentFiles.length === 0
              ? `
            <div class="text-center py-12 bg-white rounded-lg shadow">
              <div class="text-gray-400 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-gray-500">No files in this folder</p>
            </div>
          `
              : `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${currentFiles
                .map(
                  (file) => `
                <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                  <div class="text-center mb-2">
                    <div class="text-4xl mb-2">${this.getFileIcon(file.type)}</div>
                    <div class="text-sm font-medium text-gray-900 truncate">${file.name}</div>
                    <div class="text-xs text-gray-500">${this.formatFileSize(file.size)}</div>
                  </div>
                  <div class="flex justify-center space-x-2">
                    <button onclick="window.open('${file.url}', '_blank')" class="text-indigo-600 hover:text-indigo-800" title="Download">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button onclick="window.fileManager.deleteFile('${file.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
          }
        </div>
      </div>
    `;

    // Setup drag and drop after rendering
    setTimeout(() => this.setupDragAndDrop(), 100);
  }
}

// Export for use in Astro pages
window.FileManager = FileManager;
