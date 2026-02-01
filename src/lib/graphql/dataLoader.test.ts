import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DataLoader from './dataLoader';
import { DateTime, Decimal, JSON } from './resolvers';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  invoice: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  template: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  post: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  page: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  pricingPlan: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  webSocketConnection: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  realTimeNotification: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
};

describe('GraphQL DataLoader', () => {
  let dataLoader: DataLoader;

  beforeEach(() => {
    dataLoader = new DataLoader(mockPrisma as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    dataLoader.clearAllCache();
  });

  describe('User operations', () => {
    it('should cache user queries', async () => {
      const userId = 'test-user-id';
      
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'client',
        password: 'password123',
        phone: null,
        createdAt: new Date(),
        projects: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result1 = await dataLoader.user(userId);
      const result2 = await dataLoader.user(userId);

      expect(result1).toBe(result2);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should clear cache for user type', async () => {
      const userId = 'test-user-id';
      
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'client',
        password: 'password123',
        phone: null,
        createdAt: new Date(),
        projects: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await dataLoader.user(userId);
      dataLoader.clearCache('user');
      await dataLoader.user(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent-id';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await dataLoader.user(userId);

      expect(result).toBeNull();
    });
  });

  describe('Project operations', () => {
    it('should cache project queries', async () => {
      const projectId = 'test-project-id';
      
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        type: 'sekolah' as const,
        status: 'pending_payment' as const,
        userId: 'test-user-id',
        url: null,
        credentials: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'client',
        },
        invoices: [],
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result1 = await dataLoader.project(projectId);
      const result2 = await dataLoader.project(projectId);

      expect(result1).toBe(result2);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invoice operations', () => {
    it('should cache invoice queries', async () => {
      const invoiceId = 'test-invoice-id';
      
      const mockInvoice = {
        id: invoiceId,
        projectId: 'test-project-id',
        amount: 1000000,
        status: 'unpaid' as const,
        midtransOrderId: null,
        qrisUrl: null,
        paidAt: null,
        createdAt: new Date(),
        project: {
          id: 'test-project-id',
          name: 'Test Project',
          userId: 'test-user-id',
        },
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result1 = await dataLoader.invoice(invoiceId);
      const result2 = await dataLoader.invoice(invoiceId);

      expect(result1).toBe(result2);
      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache management', () => {
    it('should clear all cache', () => {
      dataLoader.clearAllCache();
      expect(dataLoader['cache'].size).toBe(0);
    });

    it('should clear specific cache type', () => {
      const cache = dataLoader['cache'] as Map<string, any>;
      cache.set('user:test1', 'value1');
      cache.set('project:test1', 'value2');
      cache.set('user:test2', 'value3');

      dataLoader.clearCache('user');
      
      const userKeys = Array.from(cache.keys()).filter(key => key.startsWith('user:'));
      expect(userKeys.length).toBe(0);
      
      const projectKeys = Array.from(cache.keys()).filter(key => key.startsWith('project:'));
      expect(projectKeys.length).toBe(1);
    });
  });
});

describe('Custom Scalar Types', () => {
  describe('DateTime', () => {
    it('should serialize Date to ISO string', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = DateTime.serialize(date);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should parse ISO string to Date', () => {
      const isoString = '2023-01-01T00:00:00.000Z';
      const result = DateTime.parseValue(isoString);
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toBe(isoString);
    });

    it('should handle null values', () => {
      expect(DateTime.serialize(null)).toBeNull();
      expect(DateTime.parseValue(null)).toBeNull();
    });
  });

  describe('Decimal', () => {
    it('should serialize decimal number', () => {
      const decimal = { toString: () => '100.50' };
      const result = Decimal.serialize(decimal);
      expect(result).toBe(100.50);
    });

    it('should parse numeric values', () => {
      expect(Decimal.parseValue(100.50)).toBe(100.50);
      expect(Decimal.parseValue('100.50')).toBe(100.50);
    });

    it('should handle null values', () => {
      expect(Decimal.serialize(null)).toBeNull();
      expect(Decimal.parseValue(null)).toBeNull();
    });
  });

  describe('JSON', () => {
    it('should serialize and parse JSON values', () => {
      const data = { key: 'value', number: 123 };
      expect(JSON.serialize(data)).toEqual(data);
      expect(JSON.parseValue(data)).toEqual(data);
    });

    it('should handle null values', () => {
      expect(JSON.serialize(null)).toBeNull();
      expect(JSON.parseValue(null)).toBeNull();
    });
  });
});

describe('GraphQL Integration', () => {
  let dataLoader: DataLoader;

  beforeEach(() => {
    dataLoader = new DataLoader(mockPrisma as any);
    vi.clearAllMocks();
  });

  it('should handle complete user workflow', async () => {
    const userId = 'test-user-id';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'client',
      password: 'password123',
      phone: null,
      createdAt: new Date(),
      projects: [],
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await dataLoader.user(userId);

    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  });

  it('should handle project creation workflow', async () => {
    const projectData = {
      name: 'New Project',
      type: 'sekolah' as const,
      userId: 'test-user-id',
    };

    const mockCreatedProject = {
      id: 'new-project-id',
      ...projectData,
      status: 'pending_payment' as const,
      url: null,
      credentials: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.project.create.mockResolvedValue(mockCreatedProject);

    const result = await mockPrisma.project.create({ data: projectData });

    expect(result).toEqual(mockCreatedProject);
    expect(mockPrisma.project.create).toHaveBeenCalledWith({ data: projectData });
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'test-user-id';
    const error = new Error('Database connection failed');
    
    mockPrisma.user.findUnique.mockRejectedValue(error);

    await expect(dataLoader.user(userId)).rejects.toThrow('Database connection failed');
  });
});