/**
 * Pattern Recognition Service Tests
 * 
 * Tests for pattern detection, learning, and recommendation capabilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PatternRecognitionService from './PatternRecognitionService';

// Mock memory service
const mockMemory = {
  storeFact: vi.fn(),
  query: vi.fn(),
  getEntityState: vi.fn(),
  getEntityHistory: vi.fn(),
  storeEntity: vi.fn(),
  retrieveBySemanticSimilarity: vi.fn(),
  consolidateMemories: vi.fn(),
  getMemoryStats: vi.fn(),
  learnFromPattern: vi.fn(),
  getSuccessfulPatterns: vi.fn(),
  clearCache: vi.fn()
};

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn()
  },
  project: {
    findMany: vi.fn()
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

import { getPrisma } from '@/lib/prisma';
vi.mock('@/lib/prisma');
const mockGetPrisma = getPrisma as any;
mockGetPrisma.mockReturnValue(mockPrisma);

describe('PatternRecognitionService', () => {
  let service: PatternRecognitionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PatternRecognitionService(mockMemory as any);
    // Clear memory cache for clean state
    mockMemory.clearCache();
  });

  describe('Pattern Detection', () => {
    it('should initialize with known architectural patterns', () => {
      const stats = service.getPatternStats();
      
      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.patterns).toHaveLength(5); // 5 initial patterns
      expect(stats.averageConfidence).toBeGreaterThan(0.8);
    });

    it('should analyze codebase for patterns', async () => {
      mockMemory.storeFact.mockResolvedValue({});

      const matches = await service.analyzeCodebase(mockContext);
      
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      expect(mockMemory.storeFact).toHaveBeenCalled();
    });

    it('should extract patterns from code changes', async () => {
      const codeContext = {
        files: ['/src/services/test.ts'],
        changes: [{
          filePath: '/src/services/test.ts',
          type: 'add' as const,
          content: 'export class TestService {}'
        }]
      };

      const patterns = await service['extractPatternsFromChanges'](codeContext);
      
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('Learning from Success', () => {
    it('should learn from successful operations', async () => {
      const operation = 'fix_test_regression';
      const codeContext = {
        files: ['/src/lib/test.ts'],
        changes: [{
          filePath: '/src/lib/test.ts',
          type: 'modify' as const,
          content: 'Updated test'
        }]
      };
      const outcome = {
        success: true,
        metrics: {
          performance: 0.95,
          testScore: 0.98,
          securityScore: 1.0
        }
      };

      await service.learnFromSuccess(mockContext, operation, codeContext, outcome);
      
      expect(mockMemory.storeFact).toHaveBeenCalledWith(
        'pattern_recognition',
        'LEARNED_FROM_SUCCESS',
        operation,
        expect.objectContaining({
          success: true,
          metrics: outcome.metrics
        }),
        expect.any(Date)
      );
    });

    it('should update pattern success rates after learning', async () => {
      // Get initial stats
      const initialStats = service.getPatternStats();
      const initialPattern = initialStats.patterns.find(p => p.id === 'atomic-services');

      if (initialPattern) {
        const codeContext = {
          files: ['/src/services/test.ts'],
          changes: [{
            filePath: '/src/services/test.ts',
            type: 'add' as const,
            content: 'export class AtomicTestService {}'
          }]
        };

        await service.learnFromSuccess(mockContext, 'add_service', codeContext, { success: true });

        const updatedStats = service.getPatternStats();
        const updatedPattern = updatedStats.patterns.find(p => p.id === 'atomic-services');
        
        expect(updatedPattern?.frequency).toBeGreaterThan(initialPattern.frequency);
      }
    });
  });

  describe('Pattern Recommendations', () => {
    it('should provide recommendations for tasks', async () => {
      const task = {
        type: 'api_development',
        description: 'Create new API endpoint',
        affectedFiles: ['/src/pages/api/', '/src/services/']
      };

      const recommendations = await service.getRecommendations(mockContext, task);
      
      expect(Array.isArray(recommendations)).toBe(true);
      
      // Should recommend error handling pattern for API development
      const hasErrorHandling = recommendations.some(r => r.pattern.id === 'error-handling');
      expect(hasErrorHandling).toBe(true);
    });

    it('should filter patterns by relevance', async () => {
      const task = {
        type: 'component_creation',
        description: 'Create new UI component',
        affectedFiles: ['/src/components/ui/']
      };

      const recommendations = await service.getRecommendations(mockContext, task);
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that recommendations are sorted by confidence
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].confidence).toBeGreaterThanOrEqual(recommendations[i].confidence);
      }
    });
  });

  describe('Pattern Validation', () => {
    it('should validate patterns against codebase', async () => {
      const validation = await service.validatePatterns(mockContext);
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('outdated');
      expect(validation).toHaveProperty('needsAttention');
      
      expect(Array.isArray(validation.valid)).toBe(true);
      expect(Array.isArray(validation.outdated)).toBe(true);
      expect(Array.isArray(validation.needsAttention)).toBe(true);
    });

    it('should identify patterns needing attention', async () => {
      // Manually adjust a pattern to need attention
      const patterns = service['knownPatterns'];
      const testPattern = patterns.get('atomic-services');
      if (testPattern) {
        testPattern.confidence = 0.75; // Below threshold
      }

      const validation = await service.validatePatterns(mockContext);
      
      expect(validation.needsAttention.length).toBeGreaterThan(0);
      const attentionPattern = validation.needsAttention.find(p => p.id === 'atomic-services');
      expect(attentionPattern?.id).toBe('atomic-services');
    });
  });

  describe('Pattern Statistics', () => {
    it('should provide accurate pattern statistics', () => {
      const stats = service.getPatternStats();
      
      expect(stats).toHaveProperty('totalPatterns');
      expect(stats).toHaveProperty('successfulPatterns');
      expect(stats).toHaveProperty('failurePatterns');
      expect(stats).toHaveProperty('averageConfidence');
      expect(stats).toHaveProperty('patterns');
      
      expect(typeof stats.totalPatterns).toBe('number');
      expect(typeof stats.averageConfidence).toBe('number');
      expect(Array.isArray(stats.patterns)).toBe(true);
    });

    it('should update statistics after pattern changes', () => {
      const initialStats = service.getPatternStats();
      
      // Add a new pattern
      const newPattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        type: 'test_pattern' as const,
        description: 'Test pattern',
        confidence: 0.90,
        frequency: 5,
        successRate: 0.95,
        examples: [],
        tags: ['test'],
        detectedAt: new Date(),
        lastValidated: new Date()
      };
      
      service['knownPatterns'].set('test-pattern', newPattern);
      service['updatePatternStats']();
      
      const updatedStats = service.getPatternStats();
      expect(updatedStats.totalPatterns).toBe(initialStats.totalPatterns + 1);
    });
  });

  describe('Code Pattern Analysis', () => {
    it('should detect service layer patterns', async () => {
      const patterns = await service['analyzeCodeForPatterns'](
        '/src/services/TestService.ts',
        'export class TestService { constructor() {} }'
      );
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].id).toBe('atomic-services');
    });

    it('should detect cache patterns', async () => {
      const patterns = await service['analyzeCodeForPatterns'](
        '/src/lib/cache.ts',
        'function getOrSet(key, value) { return cache.get(key) || value; }'
      );
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].id).toBe('cache-aside');
    });

    it('should detect error handling patterns', async () => {
      const patterns = await service['analyzeCodeForPatterns'](
        '/src/lib/error.ts',
        'function handleError(error) { return errorResponse(error.message); }'
      );
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].id).toBe('error-handling');
    });

    it('should detect component patterns', async () => {
      const patterns = await service['analyzeCodeForPatterns'](
        '/src/components/Test.tsx',
        'interface Props { name: string; } export function Test({ name }: Props) { return <div>{name}</div>; }'
      );
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].id).toBe('modular-components');
    });
  });

  describe('Pattern Extraction', () => {
    it('should extract patterns from file paths and content', async () => {
      const codeContext = {
        files: ['/src/services/auth.ts', '/src/components/Button.tsx'],
        changes: [
          {
            filePath: '/src/services/auth.ts',
            type: 'modify' as const,
            content: 'export class AuthService { login() {} }'
          },
          {
            filePath: '/src/components/Button.tsx',
            type: 'add' as const,
            content: 'interface Props { onClick: () => void; }'
          }
        ]
      };

      const patterns = await service['extractPatternsFromChanges'](codeContext);
      
      expect(patterns.length).toBeGreaterThan(0);
      
      // Should detect both service and component patterns
      const patternIds = patterns.map(p => p.id);
      expect(patternIds).toContain('atomic-services');
      expect(patternIds).toContain('modular-components');
    });
  });

  describe('Memory Integration', () => {
    it('should store pattern detection results in memory', async () => {
      mockMemory.storeFact.mockResolvedValue({});
      
      const matches = [{
        patternId: 'test-pattern',
        filePath: '/src/test.ts',
        lineStart: 1,
        lineEnd: 10,
        confidence: 0.95,
        context: 'Test context'
      }];

      await service['storeDetectionResults'](matches);
      
      expect(mockMemory.storeFact).toHaveBeenCalledTimes(matches.length);
      matches.forEach(match => {
        expect(mockMemory.storeFact).toHaveBeenCalledWith(
          'pattern_detection',
          'DETECTED_PATTERN',
          match.patternId,
          expect.objectContaining({
            filePath: match.filePath,
            confidence: match.confidence
          }),
          expect.any(Date)
        );
      });
    });
  });
});