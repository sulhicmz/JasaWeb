import { io, Socket } from 'socket.io-client';

export interface CollaborationUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ProjectParticipant {
  userId: string;
  userName: string;
  joinedAt: Date;
  cursor?: {
    x: number;
    y: number;
    documentId?: string;
    selection?: { start: number; end: number };
  };
  isTyping?: boolean;
  typingDocumentId?: string;
}

export interface CollaborationMessage {
  id: string;
  senderId: string;
  senderName: string;
  projectId: string;
  content: string;
  type: 'chat' | 'comment' | 'notification';
  recipientId?: string;
  createdAt: Date;
}

export interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface ProjectState {
  projectId: string;
  participants: ProjectParticipant[];
  documents: {
    id: string;
    title: string;
    version: number;
    lastEdited: Date;
    lastEditedBy: string;
  }[];
  recentActivity: {
    id: string;
    type: string;
    userId: string;
    userName: string;
    timestamp: Date;
    details: any;
  }[];
}

export class CollaborationService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private currentProject: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  async connect(token: string): Promise<boolean> {
    try {
      this.token = token;

      this.socket = io('/collaboration', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          console.log('Connected to collaboration service');
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('Failed to connect to collaboration service:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error connecting to collaboration service:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.currentProject = null;
  }

  async joinProject(projectId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to collaboration service');
    }

    this.currentProject = projectId;
    this.socket.emit('join_project', { projectId });
  }

  async leaveProject(projectId?: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to collaboration service');
    }

    const projectIdToLeave = projectId || this.currentProject;
    if (projectIdToLeave) {
      this.socket.emit('leave_project', { projectId: projectIdToLeave });
    }
  }

  sendCursorMove(
    position: { x: number; y: number },
    documentId?: string,
    selection?: { start: number; end: number }
  ): void {
    if (!this.socket || !this.currentProject) return;

    this.socket.emit('cursor_move', {
      projectId: this.currentProject,
      documentId,
      position,
      selection,
    });
  }

  startTyping(documentId?: string): void {
    if (!this.socket || !this.currentProject) return;

    this.socket.emit('typing_start', {
      projectId: this.currentProject,
      documentId,
    });
  }

  stopTyping(documentId?: string): void {
    if (!this.socket || !this.currentProject) return;

    this.socket.emit('typing_stop', {
      projectId: this.currentProject,
      documentId,
    });
  }

  sendMessage(
    message: string,
    type: 'chat' | 'comment' | 'notification' = 'chat',
    recipientId?: string
  ): void {
    if (!this.socket || !this.currentProject) return;

    this.socket.emit('send_message', {
      projectId: this.currentProject,
      message,
      type,
      recipientId,
    });
  }

  sendDocumentEdit(
    documentId: string,
    operation: DocumentOperation,
    version: number
  ): void {
    if (!this.socket || !this.currentProject) return;

    this.socket.emit('document_edit', {
      projectId: this.currentProject,
      documentId,
      operation,
      version,
    });
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private setupEventListeners(): void {
    // These will be set up when the socket connects
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Static methods for API calls
  static async getOnlineUsers(): Promise<CollaborationUser[]> {
    try {
      const response = await fetch('/api/collaboration/online-users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching online users:', error);
      return [];
    }
  }

  static async getProjectParticipants(
    projectId: string
  ): Promise<ProjectParticipant[]> {
    try {
      const response = await fetch(
        `/api/collaboration/projects/${projectId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching project participants:', error);
      return [];
    }
  }

  static async getProjectState(
    projectId: string
  ): Promise<ProjectState | null> {
    try {
      const response = await fetch(
        `/api/collaboration/projects/${projectId}/state`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching project state:', error);
      return null;
    }
  }

  static async getProjectMessages(
    projectId: string,
    limit = 50
  ): Promise<CollaborationMessage[]> {
    try {
      const response = await fetch(
        `/api/collaboration/projects/${projectId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ limit }),
        }
      );
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching project messages:', error);
      return [];
    }
  }

  static async createMessage(
    projectId: string,
    message: string,
    type: 'chat' | 'comment' | 'notification' = 'chat',
    recipientId?: string
  ): Promise<CollaborationMessage | null> {
    try {
      const response = await fetch(
        `/api/collaboration/projects/${projectId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ content: message, type, recipientId }),
        }
      );
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error creating message:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const collaborationService = new CollaborationService();
