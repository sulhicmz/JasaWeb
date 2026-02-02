/**
 * JasaWeb Memory Service Tests
 * 
 * Tests for temporal memory, entity tracking, and knowledge graph functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import JasaWebTempMemory from './JasaWebMemoryService';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn()
  }
};

// Mock context
const mockContext = {
  runtime: {
    env: {
      DATABASE_URL: 'test-db-url'
    }
  }
};

vi.mock('@/lib/prisma', () => ({
  getPrisma: vi.fn(() => mockPrisma)
}));

describe('JasaWebTempMemory', () => {
  let memory: JasaWebTempMemory;

  beforeEach(() => {
    vi.clearAllMocks();
    memory = new JasaWebTempMemory(mockContext);
    memory.clearCache();
  });

  describe('Fact Storage', () => {
    beforeEach(() => {
      memory.clearCache();
    });
    
    it('should store a temporal fact', async () => {
      const fact = await memory.storeFact(
        'test-entity',
        'HAS_PROPERTY',
        'value',
        { type: 'test' },
        new Date()
      );

      expect(fact).toBeDefined();
      expect(fact.id).toMatch(/^fact_\d+_\w+$/);
      expect(fact.subjectId).toBe('test-entity');
      expect(fact.relationship).toBe('HAS_PROPERTY');
      expect(fact.objectId).toBe('value');
      expect(fact.properties).toEqual({ type: 'test' });
    });

    it('should store facts with validity periods', async () => {
      const validFrom = new Date('2025-01-01');
      const validUntil = new Date('2025-01-31');

      const fact = await memory.storeFact(
        'test-entity',
        'WAS_VALID',
        'status',
        { status: 'active' },
        validFrom,
        validUntil
      );

      expect(fact.validFrom).toBe(validFrom);
      expect(fact.validUntil).toBe(validUntil);
    });

it('should trigger consolidation when cache is full', async () => {
      const testMemory = new JasaWebTempMemory(mockContext);
      testMemory.clearCache();
      
      const calls = [];
      const originalConsolidate = testMemory.consolidateMemories;
      testMemory.consolidateMemories = async () => {
        calls.push('consolidate');
        await originalConsolidate.call(testMemory);
      };

      for (let i = 0; i < 1001; i++) {
        await testMemory.storeFact(
          `entity-${i}`,
          'HAS_PROPERTY',
          `value-${i}`,
          {},
          new Date()
        );
      }

      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('Fact Querying', () => {
    beforeEach(async () => {
      // Clear cache
      memory.clearCache();
      // Store some test facts
      await memory.storeFact('user1', 'HAS_ROLE', 'admin', {}, new Date());
      await memory.storeFact('user1', 'HAS_EMAIL', 'test@example.com', {}, new Date());
      await memory.storeFact('project1', 'BELONGS_TO', 'user1', {}, new Date());
    });

    it('should query facts by subject ID', async () => {
      const facts = await memory.query({ subjectId: 'user1' });
      
      expect(facts).toHaveLength(2);
      expect(facts.every(f => f.subjectId === 'user1')).toBe(true);
    });

    it('should query facts by relationship', async () => {
      const facts = await memory.query({ relationship: 'HAS_ROLE' });
      
      expect(facts).toHaveLength(1);
      expect(facts[0].relationship).toBe('HAS_ROLE');
    });

    it('should query facts by object ID', async () => {
      const facts = await memory.query({ objectId: 'admin' });
      
      expect(facts).toHaveLength(1);
      expect(facts[0].objectId).toBe('admin');
    });

    it('should query facts by time range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const facts = await memory.query({
        fromTime: yesterday,
        toTime: tomorrow
      });

      expect(facts.length).toBeGreaterThan(0);
    });

    it('should apply limit to query results', async () => {
      const facts = await memory.query({ limit: 2 });
      
      expect(facts.length).toBeLessThanOrEqual(2);
    });

    it('should sort facts by creation date (newest first)', async () => {
      const facts = await memory.query({});
      
      for (let i = 1; i < facts.length; i++) {
        expect(facts[i-1].createdAt.getTime()).toBeGreaterThanOrEqual(facts[i].createdAt.getTime());
      }
    });
  });

  describe('Entity Management', () => {
    beforeEach(() => {
      memory.clearCache();
    });
    
    it('should get entity state at specific time', async () => {
      const testTime = new Date();
      await memory.storeEntity('test-user', 'user', { name: 'Test User' });

      const entity = await memory.getEntityState('test-user', testTime);
      
      expect(entity).toBeDefined();
      expect(entity?.id).toBe('test-user');
      expect(entity?.type).toBe('user');
      expect(entity?.properties.name).toBe('Test User');
    });

    it('should return null for non-existent entity', async () => {
      const entity = await memory.getEntityState('non-existent', new Date());
      
      expect(entity).toBeNull();
    });

    it('should get entity history', async () => {
      await memory.storeFact('test-entity', 'HAD_STATE', 'initial', {}, new Date('2025-01-01'));
      await memory.storeFact('test-entity', 'HAD_STATE', 'updated', {}, new Date('2025-01-02'));

      const history = await memory.getEntityHistory('test-entity');
      
      expect(history).toHaveLength(2);
      expect(history[0].properties).toEqual({}); // Most recent first
    });

    it('should store entity properties', async () => {
      const entity = await memory.storeEntity(
        'service1',
        'service',
        { name: 'Test Service', version: '1.0.0' }
      );

      expect(entity.id).toBe('service1');
      expect(entity.type).toBe('service');
      expect(entity.properties).toEqual({
        name: 'Test Service',
        version: '1.0.0'
      });
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      // Store test facts for semantic search
      await memory.storeFact(
        'pattern1',
        'IS_TYPE',
        'architectural',
        { description: 'Service layer pattern' },
        new Date()
      );
      await memory.storeFact(
        'pattern2',
        'IMPLEMENTS',
        'caching',
        { description: 'Cache aside pattern' },
        new Date()
      );
    });

    it('should retrieve facts by semantic similarity', async () => {
      const facts = await memory.retrieveBySemanticSimilarity('service architecture');

      expect(facts.length).toBeGreaterThan(0);
    });

    it('should limit semantic search results', async () => {
      const facts = await memory.retrieveBySemanticSimilarity('pattern', 1);

      expect(facts.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const facts = await memory.retrieveBySemanticSimilarity('nonexistent term');

      expect(facts).toHaveLength(0);
    });
  });

  describe('Memory Consolidation', () => {
    beforeEach(() => {
      memory.clearCache();
    });
    
    it('should consolidate outdated facts', async () => {
      // Add old facts
      const oldDate = new Date('2024-01-01');
      await memory.storeFact('old1', 'HAS_PROPERTY', 'value1', {}, oldDate);
      await memory.storeFact('old2', 'HAS_PROPERTY', 'value2', {}, oldDate);

      const statsBefore = await memory.getMemoryStats();
      
      await memory.consolidateMemories();

      const statsAfter = await memory.getMemoryStats();
      
      // Verify consolidation occurred
      expect(statsAfter.lastConsolidation).not.toBeNull();
      expect(statsAfter.lastConsolidation).not.toEqual(statsBefore.lastConsolidation);
    });

    it('should merge related facts', async () => {
      const fact1 = {
        id: 'fact1',
        subjectId: 'entity1',
        relationship: 'HAS_PROPERTY',
        objectId: 'value1',
        properties: { type: 'test' },
        validFrom: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01')
      } as any;

      const fact2 = {
        id: 'fact2',
        subjectId: 'entity1',
        relationship: 'HAS_PROPERTY',
        objectId: 'value1',
        properties: { status: 'active' },
        validFrom: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02')
      } as any;

      const merged = await memory['mergeRelatedFacts']([fact1, fact2]);

      expect(merged).toHaveLength(1);
      expect(merged[0].properties).toEqual({
        type: 'test',
        status: 'active'
      });
    });
  });

  describe('Memory Statistics', () => {
    it('should return memory statistics', async () => {
      // Clear cache to start fresh
      memory.clearCache();
      
      await memory.storeFact('test1', 'HAS', 'value1', {}, new Date());
      await memory.storeFact('test2', 'HAS', 'value2', {}, new Date());
      await memory.storeEntity('entity1', 'test', {});

      const stats = await memory.getMemoryStats();

      expect(stats.totalFacts).toBe(3);
      expect(stats.totalEntities).toBe(1);
      expect(stats.recentAdditions).toBe(3);
      expect(stats.consolidationNeeded).toBe(false);
    });

    it('should identify when consolidation is needed', async () => {
      // Clear cache to start fresh
      memory.clearCache();
      
      // Fill cache beyond threshold
      for (let i = 0; i < 1001; i++) {
        await memory.storeFact(`test${i}`, 'HAS', `value${i}`, {}, new Date());
      }

      const stats = await memory.getMemoryStats();

      expect(stats.consolidationNeeded).toBe(true);
    });
  });

  describe('Pattern Learning', () => {
    it('should learn from pattern outcomes', async () => {
      await memory.learnFromPattern('pattern1', 'success', 0.95);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      // In real implementation, this would store in database
    });

    it('should get successful patterns', async () => {
      // Clear cache to start fresh
      memory.clearCache();
      
      // Store some learning facts
      await memory.storeFact(
        'pattern1',
        'HAS_OUTCOME',
        'success',
        { outcome: 'success', confidence: 0.9, type: 'pattern_learning' },
        new Date()
      );
      await memory.storeFact(
        'pattern2',
        'HAS_OUTCOME',
        'success',
        { outcome: 'success', confidence: 0.85, type: 'pattern_learning' },
        new Date()
      );
      await memory.storeFact(
        'pattern3',
        'HAS_OUTCOME',
        'failure',
        { outcome: 'failure', confidence: 0.7, type: 'pattern_learning' },
        new Date()
      );

      const successfulPatterns = await memory.getSuccessfulPatterns(0.8);

      expect(successfulPatterns).toHaveLength(2);
      expect(successfulPatterns.every(p => p.properties.outcome === 'success')).toBe(true);
      expect(successfulPatterns.every(p => p.properties.confidence >= 0.8)).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should generate unique IDs', () => {
      const id1 = (memory as any).generateId('test');
      const id2 = (memory as any).generateId('test');

      expect(id1).toMatch(/^test_\d+_\w+$/);
      expect(id2).toMatch(/^test_\d+_\w+$/);
      expect(id1).not.toBe(id2);
    });

    it('should calculate semantic scores', async () => {
      const fact = {
        subjectId: 'test-entity',
        relationship: 'has-property',
        objectId: 'test-value',
        properties: { type: 'test', status: 'active' }
      } as any;

      const score = (memory as any).calculateSemanticScore('test entity active', fact);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});