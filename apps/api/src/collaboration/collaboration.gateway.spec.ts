import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationGateway } from '../collaboration.gateway';
import { CollaborationService } from '../collaboration.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/users.service';
import { Server, Socket } from 'socket.io';

describe('CollaborationGateway', () => {
  let gateway: CollaborationGateway;
  let collaborationService: CollaborationService;
  let jwtService: JwtService;
  let userService: UserService;
  let server: Server;
  let client: Socket;

  const mockCollaborationService = {
    addUserToOnline: jest.fn(),
    removeUserFromOnline: jest.fn(),
    addUserToProject: jest.fn(),
    removeUserFromProject: jest.fn(),
    getProjectState: jest.fn(),
    createMessage: jest.fn(),
    applyDocumentEdit: jest.fn(),
    getUserSocket: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn(() => mockServer),
  };

  const mockClient = {
    id: 'socket1',
    handshake: {
      auth: {
        token: 'valid-token',
      },
    },
    user: null,
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn(() => mockClient),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationGateway,
        {
          provide: CollaborationService,
          useValue: mockCollaborationService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    gateway = module.get<CollaborationGateway>(CollaborationGateway);
    collaborationService =
      module.get<CollaborationService>(CollaborationService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);

    gateway['server'] = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate user and add to online users', async () => {
      const payload = { sub: 'user1' };
      const user = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org1',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserService.findById.mockResolvedValue(user);

      await gateway.handleConnection(mockClient as any);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockUserService.findById).toHaveBeenCalledWith('user1');
      expect(mockClient.join).toHaveBeenCalledWith('org_org1');
      expect(mockCollaborationService.addUserToOnline).toHaveBeenCalledWith(
        'user1',
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          socketId: 'socket1',
        }
      );
      expect(mockClient.user).toEqual(user);
    });

    it('should disconnect client if authentication fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockClient as any);

      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user from online users and notify others', async () => {
      mockClient.user = {
        id: 'user1',
        email: 'test@example.com',
        organizationId: 'org1',
      };

      await gateway.handleDisconnect(mockClient as any);

      expect(
        mockCollaborationService.removeUserFromOnline
      ).toHaveBeenCalledWith('user1');
      expect(mockClient.to).toHaveBeenCalledWith('org_org1');
      expect(mockClient.emit).toHaveBeenCalledWith('user_offline', {
        userId: 'user1',
      });
    });
  });

  describe('handleJoinProject', () => {
    it('should add user to project and send project state', async () => {
      const data = { projectId: 'project1' };
      const projectState = { projectId: 'project1', participants: [] };

      mockClient.user = {
        id: 'user1',
        email: 'test@example.com',
        organizationId: 'org1',
      };

      mockCollaborationService.getProjectState.mockResolvedValue(projectState);

      const result = await gateway.handleJoinProject(data, mockClient as any);

      expect(mockClient.join).toHaveBeenCalledWith('project_project1');
      expect(mockCollaborationService.addUserToProject).toHaveBeenCalledWith(
        'user1',
        'project1'
      );
      expect(mockClient.to).toHaveBeenCalledWith('project_project1');
      expect(mockClient.emit).toHaveBeenCalledWith('user_joined_project', {
        projectId: 'project1',
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: undefined,
        },
      });
      expect(mockClient.emit).toHaveBeenCalledWith(
        'project_state',
        projectState
      );
      expect(result).toEqual({ success: true, projectId: 'project1' });
    });

    it('should throw error if user is not authenticated', async () => {
      const data = { projectId: 'project1' };
      mockClient.user = null;

      await expect(
        gateway.handleJoinProject(data, mockClient as any)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('handleCursorMove', () => {
    it('should broadcast cursor position to other users', async () => {
      const data = {
        projectId: 'project1',
        position: { x: 100, y: 200 },
        selection: { start: 10, end: 20 },
      };

      mockClient.user = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await gateway.handleCursorMove(data, mockClient as any);

      expect(mockClient.to).toHaveBeenCalledWith('project_project1');
      expect(mockClient.emit).toHaveBeenCalledWith('cursor_update', {
        userId: 'user1',
        userName: 'Test User',
        position: { x: 100, y: 200 },
        selection: { start: 10, end: 20 },
        documentId: undefined,
        timestamp: expect.any(String),
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleSendMessage', () => {
    it('should create and broadcast message', async () => {
      const data = {
        projectId: 'project1',
        message: 'Hello world',
        type: 'chat' as const,
      };

      const message = {
        id: 'msg1',
        senderId: 'user1',
        projectId: 'project1',
        content: 'Hello world',
        type: 'chat',
        createdAt: new Date(),
      };

      mockClient.user = {
        id: 'user1',
        email: 'test@example.com',
      };

      mockCollaborationService.createMessage.mockResolvedValue(message);

      const result = await gateway.handleSendMessage(data, mockClient as any);

      expect(mockCollaborationService.createMessage).toHaveBeenCalledWith({
        senderId: 'user1',
        projectId: 'project1',
        content: 'Hello world',
        type: 'chat',
        recipientId: undefined,
      });
      expect(mockServer.to).toHaveBeenCalledWith('project_project1');
      expect(mockServer.emit).toHaveBeenCalledWith('new_message', message);
      expect(result).toEqual({ success: true, message });
    });

    it('should send direct message if recipientId is provided', async () => {
      const data = {
        projectId: 'project1',
        message: 'Private message',
        type: 'chat' as const,
        recipientId: 'user2',
      };

      const message = {
        id: 'msg1',
        senderId: 'user1',
        projectId: 'project1',
        content: 'Private message',
        type: 'chat',
        recipientId: 'user2',
        createdAt: new Date(),
      };

      mockClient.user = { id: 'user1' };
      mockCollaborationService.createMessage.mockResolvedValue(message);
      mockCollaborationService.getUserSocket.mockResolvedValue('socket2');

      await gateway.handleSendMessage(data, mockClient as any);

      expect(mockCollaborationService.getUserSocket).toHaveBeenCalledWith(
        'user2'
      );
      expect(mockServer.to).toHaveBeenCalledWith('socket2');
      expect(mockServer.emit).toHaveBeenCalledWith('new_message', message);
    });
  });

  describe('handleDocumentEdit', () => {
    it('should apply document edit and broadcast to other users', async () => {
      const data = {
        projectId: 'project1',
        documentId: 'doc1',
        operation: {
          type: 'insert' as const,
          position: 5,
          content: 'test',
        },
        version: 1,
      };

      const editResult = { newVersion: 2 };

      mockClient.user = { id: 'user1' };
      mockCollaborationService.applyDocumentEdit.mockResolvedValue(editResult);

      const result = await gateway.handleDocumentEdit(data, mockClient as any);

      expect(mockCollaborationService.applyDocumentEdit).toHaveBeenCalledWith({
        documentId: 'doc1',
        operation: data.operation,
        version: 1,
        userId: 'user1',
      });
      expect(mockClient.to).toHaveBeenCalledWith('project_project1');
      expect(mockClient.emit).toHaveBeenCalledWith('document_updated', {
        documentId: 'doc1',
        operation: data.operation,
        newVersion: 2,
        userId: 'user1',
        timestamp: expect.any(String),
      });
      expect(result).toEqual({ success: true, newVersion: 2 });
    });

    it('should handle edit errors and emit error event', async () => {
      const data = {
        projectId: 'project1',
        documentId: 'doc1',
        operation: {
          type: 'insert' as const,
          position: 5,
          content: 'test',
        },
        version: 1,
      };

      mockClient.user = { id: 'user1' };
      mockCollaborationService.applyDocumentEdit.mockRejectedValue(
        new Error('Edit failed')
      );

      await expect(
        gateway.handleDocumentEdit(data, mockClient as any)
      ).rejects.toThrow('Edit operation failed');
      expect(mockClient.emit).toHaveBeenCalledWith('edit_error', {
        documentId: 'doc1',
        error: 'Edit failed',
      });
    });
  });
});
