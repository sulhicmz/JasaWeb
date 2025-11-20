import { Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../common/database/prisma.service';
import { AuditService } from '../common/services/audit.service';

export interface OnlineUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  socketId: string;
  lastSeen: Date;
}

export interface ProjectParticipant {
  userId: string;
  projectId: string;
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

export interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface DocumentEditRequest {
  documentId: string;
  operation: DocumentOperation;
  version: number;
  userId: string;
}

export interface DocumentEditResult {
  newVersion: number;
  transformedOperation?: DocumentOperation;
}

export interface Message {
  id: string;
  senderId: string;
  projectId: string;
  content: string;
  type: 'chat' | 'comment' | 'notification';
  recipientId?: string;
  createdAt: Date;
  sender?: {
    name: string;
    email: string;
  };
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

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private readonly ONLINE_USERS_KEY = 'online_users';
  private readonly PROJECT_PARTICIPANTS_KEY = 'project_participants';
  private readonly DOCUMENT_VERSIONS_KEY = 'document_versions';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheManager: Cache,
    private readonly auditService: AuditService
  ) {}

  async addUserToOnline(
    userId: string,
    userData: Omit<OnlineUser, 'lastSeen'>
  ) {
    const onlineUsers: OnlineUser[] =
      (await this.cacheManager.get(this.ONLINE_USERS_KEY)) || [];

    // Remove existing entry for this user
    const filteredUsers = onlineUsers.filter((user) => user.id !== userId);

    // Add updated user
    const updatedUser: OnlineUser = {
      ...userData,
      lastSeen: new Date(),
    };

    filteredUsers.push(updatedUser);
    await this.cacheManager.set(this.ONLINE_USERS_KEY, filteredUsers, 300); // 5 minutes TTL

    this.logger.log(`User ${userData.email} is now online`);
  }

  async removeUserFromOnline(userId: string) {
    const onlineUsers: OnlineUser[] =
      (await this.cacheManager.get(this.ONLINE_USERS_KEY)) || [];
    const filteredUsers = onlineUsers.filter((user) => user.id !== userId);
    await this.cacheManager.set(this.ONLINE_USERS_KEY, filteredUsers, 300);

    this.logger.log(`User ${userId} is now offline`);
  }

  async getOnlineUsers(organizationId?: string): Promise<OnlineUser[]> {
    const onlineUsers: OnlineUser[] =
      (await this.cacheManager.get(this.ONLINE_USERS_KEY)) || [];

    if (organizationId) {
      return onlineUsers.filter(
        (user) => user.organizationId === organizationId
      );
    }

    return onlineUsers;
  }

  async getUserSocket(userId: string): Promise<string | null> {
    const onlineUsers: OnlineUser[] =
      (await this.cacheManager.get(this.ONLINE_USERS_KEY)) || [];
    const user = onlineUsers.find((u) => u.id === userId);
    return user?.socketId || null;
  }

  async addUserToProject(userId: string, projectId: string) {
    const participants: ProjectParticipant[] =
      (await this.cacheManager.get(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`
      )) || [];

    // Remove existing entry for this user
    const filteredParticipants = participants.filter(
      (p) => p.userId !== userId
    );

    // Add updated participant
    const participant: ProjectParticipant = {
      userId,
      projectId,
      joinedAt: new Date(),
    };

    filteredParticipants.push(participant);
    await this.cacheManager.set(
      `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`,
      filteredParticipants,
      3600
    ); // 1 hour TTL

    // Log activity
    await this.logActivity(projectId, userId, 'joined_project', { projectId });

    this.logger.log(`User ${userId} joined project ${projectId}`);
  }

  async removeUserFromProject(userId: string, projectId: string) {
    const participants: ProjectParticipant[] =
      (await this.cacheManager.get(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`
      )) || [];
    const filteredParticipants = participants.filter(
      (p) => p.userId !== userId
    );
    await this.cacheManager.set(
      `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`,
      filteredParticipants,
      3600
    );

    // Log activity
    await this.logActivity(projectId, userId, 'left_project', { projectId });

    this.logger.log(`User ${userId} left project ${projectId}`);
  }

  async updateParticipantCursor(
    userId: string,
    projectId: string,
    cursor: ProjectParticipant['cursor']
  ) {
    const participants: ProjectParticipant[] =
      (await this.cacheManager.get(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`
      )) || [];

    const participantIndex = participants.findIndex((p) => p.userId === userId);
    if (participantIndex !== -1) {
      participants[participantIndex].cursor = cursor;
      await this.cacheManager.set(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`,
        participants,
        3600
      );
    }
  }

  async updateParticipantTyping(
    userId: string,
    projectId: string,
    isTyping: boolean,
    documentId?: string
  ) {
    const participants: ProjectParticipant[] =
      (await this.cacheManager.get(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`
      )) || [];

    const participantIndex = participants.findIndex((p) => p.userId === userId);
    if (participantIndex !== -1) {
      participants[participantIndex].isTyping = isTyping;
      participants[participantIndex].typingDocumentId = documentId;
      await this.cacheManager.set(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`,
        participants,
        3600
      );
    }
  }

  async getProjectParticipants(
    projectId: string
  ): Promise<ProjectParticipant[]> {
    return (
      (await this.cacheManager.get(
        `${this.PROJECT_PARTICIPANTS_KEY}_${projectId}`
      )) || []
    );
  }

  async getProjectState(projectId: string): Promise<ProjectState> {
    const participants = await this.getProjectParticipants(projectId);

    // Get project documents
    const documents = await this.prisma.document.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        version: true,
        updatedAt: true,
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get recent activity
    const recentActivity = await this.getRecentActivity(projectId, 10);

    return {
      projectId,
      participants,
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        version: doc.version,
        lastEdited: doc.updatedAt,
        lastEditedBy: doc.updatedBy.id,
      })),
      recentActivity,
    };
  }

  async applyDocumentEdit(
    request: DocumentEditRequest
  ): Promise<DocumentEditResult> {
    const { documentId, operation, version, userId } = request;

    // Get current document version
    const currentVersion = await this.getDocumentVersion(documentId);

    if (currentVersion !== version) {
      // Conflict detected - apply operational transformation
      const transformedOperation = await this.transformOperation(
        operation,
        version,
        currentVersion,
        documentId
      );

      // Apply transformed operation
      await this.applyOperationToDocument(documentId, transformedOperation);

      return {
        newVersion: currentVersion + 1,
        transformedOperation,
      };
    } else {
      // No conflict - apply operation directly
      await this.applyOperationToDocument(documentId, operation);

      // Update document version
      const newVersion = version + 1;
      await this.setDocumentVersion(documentId, newVersion);

      // Update document in database
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          version: newVersion,
          updatedAt: new Date(),
          updatedById: userId,
        },
      });

      // Log activity
      await this.logActivity(
        (await this.prisma.document.findUnique({ where: { id: documentId } }))
          ?.projectId || '',
        userId,
        'edited_document',
        { documentId, operation, version: newVersion }
      );

      return { newVersion };
    }
  }

  private async getDocumentVersion(documentId: string): Promise<number> {
    const versions: Record<string, number> =
      (await this.cacheManager.get(this.DOCUMENT_VERSIONS_KEY)) || {};
    return versions[documentId] || 1;
  }

  private async setDocumentVersion(
    documentId: string,
    version: number
  ): Promise<void> {
    const versions: Record<string, number> =
      (await this.cacheManager.get(this.DOCUMENT_VERSIONS_KEY)) || {};
    versions[documentId] = version;
    await this.cacheManager.set(this.DOCUMENT_VERSIONS_KEY, versions, 3600);
  }

  private async transformOperation(
    operation: DocumentOperation,
    fromVersion: number,
    toVersion: number,
    documentId: string
  ): Promise<DocumentOperation> {
    // Simplified operational transformation
    // In a real implementation, this would be more sophisticated
    // For now, we'll just adjust the position based on concurrent edits

    // Get concurrent operations
    const concurrentOps = await this.getConcurrentOperations(
      documentId,
      fromVersion,
      toVersion
    );

    let adjustedPosition = operation.position;

    for (const concurrentOp of concurrentOps) {
      if (
        concurrentOp.type === 'insert' &&
        concurrentOp.position <= adjustedPosition
      ) {
        adjustedPosition += concurrentOp.content?.length || 0;
      } else if (
        concurrentOp.type === 'delete' &&
        concurrentOp.position < adjustedPosition
      ) {
        adjustedPosition -= concurrentOp.length || 0;
      }
    }

    return {
      ...operation,
      position: adjustedPosition,
    };
  }

  private async getConcurrentOperations(
    documentId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<DocumentOperation[]> {
    // In a real implementation, this would retrieve operations from a database
    // For now, return empty array (no concurrent operations)
    return [];
  }

  private async applyOperationToDocument(
    documentId: string,
    operation: DocumentOperation
  ): Promise<void> {
    // In a real implementation, this would apply the operation to the document content
    // For now, we'll just log the operation
    this.logger.log(`Applied operation to document ${documentId}:`, operation);
  }

  async createMessage(data: {
    senderId: string;
    projectId: string;
    content: string;
    type: 'chat' | 'comment' | 'notification';
    recipientId?: string;
  }): Promise<Message> {
    const message = await this.prisma.message.create({
      data: {
        senderId: data.senderId,
        projectId: data.projectId,
        content: data.content,
        type: data.type,
        recipientId: data.recipientId,
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await this.logActivity(data.projectId, data.senderId, 'sent_message', {
      messageId: message.id,
      type: data.type,
      recipientId: data.recipientId,
    });

    return {
      id: message.id,
      senderId: message.senderId,
      projectId: message.projectId,
      content: message.content,
      type: message.type as 'chat' | 'comment' | 'notification',
      recipientId: message.recipientId,
      createdAt: message.createdAt,
      sender: message.sender,
    };
  }

  async getProjectMessages(projectId: string, limit = 50): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { projectId },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      projectId: msg.projectId,
      content: msg.content,
      type: msg.type as 'chat' | 'comment' | 'notification',
      recipientId: msg.recipientId,
      createdAt: msg.createdAt,
      sender: msg.sender,
    }));
  }

  private async logActivity(
    projectId: string,
    userId: string,
    activityType: string,
    details: any
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Store activity in cache (in a real implementation, this would go to a database)
      const activityKey = `project_activity_${projectId}`;
      const activities: any[] =
        (await this.cacheManager.get(activityKey)) || [];

      activities.unshift({
        id: `activity_${Date.now()}_${Math.random()}`,
        type: activityType,
        userId,
        userName: user?.name || 'Unknown User',
        timestamp: new Date(),
        details,
      });

      // Keep only last 100 activities
      const limitedActivities = activities.slice(0, 100);
      await this.cacheManager.set(activityKey, limitedActivities, 3600);

      // Also log to audit service
      await this.auditService.logActivity({
        userId,
        action: activityType,
        resourceType: 'project',
        resourceId: projectId,
        details,
      });
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error.message}`);
    }
  }

  private async getRecentActivity(
    projectId: string,
    limit = 10
  ): Promise<any[]> {
    const activityKey = `project_activity_${projectId}`;
    const activities: any[] = (await this.cacheManager.get(activityKey)) || [];
    return activities.slice(0, limit);
  }
}
