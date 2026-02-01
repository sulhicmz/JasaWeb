/**
 * JasaWeb Temporal Memory Service
 * 
 * Implements persistent memory for autonomous agents with temporal knowledge graphs,
 * entity tracking, and cross-session learning capabilities.
 */



export interface TemporalFact {
  id: string;
  subjectId: string;
  relationship: string;
  objectId: string;
  properties: Record<string, any>;
  validFrom: Date;
  validUntil?: Date;
  createdAt: Date;
}

export interface Entity {
  id: string;
  type: 'user' | 'project' | 'service' | 'component' | 'test' | 'issue' | 'pattern' | 'agent';
  properties: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryQuery {
  subjectId?: string;
  relationship?: string;
  objectId?: string;
  fromTime?: Date;
  toTime?: Date;
  entityType?: string;
  limit?: number;
}

export interface MemoryStats {
  totalFacts: number;
  totalEntities: number;
  recentAdditions: number;
  consolidationNeeded: boolean;
  lastConsolidation: Date;
}

export class JasaWebTempMemory {
  
  private factCache = new Map<string, TemporalFact>();
  private entityCache = new Map<string, Entity>();
  private lastConsolidation = new Date();

  constructor(_context: any) {}

  /**
   * Clear all caches (for testing)
   */
  clearCache(): void {
    this.factCache.clear();
    this.entityCache.clear();
  }

  /**
   * Store a temporal fact in memory
   */
  async storeFact(
    subjectId: string,
    relationship: string,
    objectId: string,
    properties: Record<string, any>,
    validFrom: Date,
    validUntil?: Date
  ): Promise<TemporalFact> {
    const fact: TemporalFact = {
      id: this.generateId('fact'),
      subjectId,
      relationship,
      objectId,
      properties,
      validFrom,
      validUntil,
      createdAt: new Date()
    };

    // Store in memory
    this.factCache.set(fact.id, fact);

    // Persist to database (simplified - would use proper schema in production)
    await this.persistFact(fact);

    // Check if consolidation is needed
    if (this.factCache.size > 1000) {
      await this.consolidateMemories();
    }

    return fact;
  }

  /**
   * Query facts from memory
   */
  async query(query: MemoryQuery): Promise<TemporalFact[]> {
    let facts = Array.from(this.factCache.values());

    // Apply filters
    if (query.subjectId) {
      facts = facts.filter(f => f.subjectId === query.subjectId);
    }
    if (query.relationship) {
      facts = facts.filter(f => f.relationship === query.relationship);
    }
    if (query.objectId) {
      facts = facts.filter(f => f.objectId === query.objectId);
    }
    if (query.fromTime) {
      facts = facts.filter(f => f.validFrom >= query.fromTime!);
    }
    if (query.toTime) {
      facts = facts.filter(f => !f.validUntil || f.validUntil <= query.toTime!);
    }

    // Sort by creation date (newest first)
    facts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply limit
    if (query.limit) {
      facts = facts.slice(0, query.limit);
    }

    return facts;
  }

  /**
   * Get entity state at a specific time
   */
  async getEntityState(entityId: string, atTime: Date): Promise<Entity | null> {
    // Check cache first
    if (this.entityCache.has(entityId)) {
      const entity = this.entityCache.get(entityId)!;
      if (entity.updatedAt <= atTime) {
        return entity;
      }
    }

    // Query facts for this entity
    const facts = await this.query({
      subjectId: entityId,
      toTime: atTime
    });

    if (facts.length === 0) {
      return null;
    }

    // Reconstruct entity state from facts
    const latestFact = facts[0];
    const entity: Entity = {
      id: entityId,
      type: latestFact.properties.entityType || 'unknown',
      properties: latestFact.properties,
      createdAt: latestFact.createdAt,
      updatedAt: latestFact.validFrom
    };

    // Cache the reconstructed entity
    this.entityCache.set(entityId, entity);

    return entity;
  }

  /**
   * Get entity history
   */
  async getEntityHistory(entityId: string): Promise<TemporalFact[]> {
    return this.query({
      subjectId: entityId
    });
  }

  /**
   * Store or update an entity
   */
  async storeEntity(
    entityId: string,
    type: Entity['type'],
    properties: Record<string, any>
  ): Promise<Entity> {
    const entity: Entity = {
      id: entityId,
      type,
      properties,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.entityCache.set(entityId, entity);

    // Store as a fact for temporal tracking
    await this.storeFact(
      entityId,
      'HAS_STATE',
      'entity',
      {
        ...properties,
        entityType: type
      },
      new Date()
    );

    return entity;
  }

  /**
   * Retrieve facts by semantic similarity
   */
  async retrieveBySemanticSimilarity(
    query: string,
    limit: number = 10
  ): Promise<TemporalFact[]> {
    // Simplified semantic search - would use embeddings in production
    const allFacts = Array.from(this.factCache.values());
    
    // Score facts based on keyword matching
    const scored = allFacts.map(fact => {
      const score = this.calculateSemanticScore(query, fact);
      return { fact, score };
    });

    // Filter and sort by score
    const relevant = scored
      .filter(s => s.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.fact);

    return relevant;
  }

  /**
   * Consolidate memories to optimize storage
   */
  async consolidateMemories(): Promise<void> {
    console.log(`Consolidating ${this.factCache.size} facts...`);

    // 1. Identify outdated facts
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const outdatedFacts = Array.from(this.factCache.values())
      .filter(f => f.createdAt < thirtyDaysAgo);

    // 2. Merge related facts
    const mergedFacts = await this.mergeRelatedFacts(outdatedFacts);

    // 3. Update cache with consolidated facts
    for (const fact of outdatedFacts) {
      this.factCache.delete(fact.id);
    }

    for (const fact of mergedFacts) {
      this.factCache.set(fact.id, fact);
    }

    // 4. Update last consolidation time
    this.lastConsolidation = new Date();

    console.log(`Consolidation complete: ${outdatedFacts.length} → ${mergedFacts.length} facts`);
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentAdditions = Array.from(this.factCache.values())
      .filter(f => f.createdAt >= sevenDaysAgo).length;

    return {
      totalFacts: this.factCache.size,
      totalEntities: this.entityCache.size,
      recentAdditions,
      consolidationNeeded: this.factCache.size > 1000,
      lastConsolidation: this.lastConsolidation
    };
  }

  /**
   * Learn from a pattern
   */
  async learnFromPattern(
    patternId: string,
    outcome: string,
    confidence: number
  ): Promise<void> {
    await this.storeFact(
      patternId,
      'HAS_OUTCOME',
      outcome,
      {
        confidence,
        learnedAt: new Date().toISOString(),
        type: 'pattern_learning'
      },
      new Date()
    );
  }

  /**
   * Get successful patterns
   */
  async getSuccessfulPatterns(minConfidence: number = 0.8): Promise<TemporalFact[]> {
    return this.query({
      relationship: 'HAS_OUTCOME',
      limit: 100
    }).then(facts => 
      facts.filter(f => 
        f.properties.outcome === 'success' && 
        f.properties.confidence >= minConfidence
      )
    );
  }

  /**
   * Private helper methods
   */

  private generateId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async persistFact(fact: TemporalFact): Promise<void> {
    // In production, this would persist to database
    // For now, we'll use in-memory storage with periodic persistence
    console.debug(`Persisting fact: ${fact.id}`);
  }

  private calculateSemanticScore(query: string, fact: TemporalFact): number {
    // Simplified semantic scoring - would use embeddings in production
    const searchText = `${fact.subjectId} ${fact.relationship} ${fact.objectId} ${JSON.stringify(fact.properties)}`.toLowerCase();
    const queryTerms = query.toLowerCase().split(' ');
    
    let score = 0;
    for (const term of queryTerms) {
      if (searchText.includes(term)) {
        score += 1;
      }
    }
    
    return Math.min(score / queryTerms.length, 1);
  }

  private async mergeRelatedFacts(facts: TemporalFact[]): Promise<TemporalFact[]> {
    // Simplified merging logic
    const merged = new Map<string, TemporalFact>();
    
    for (const fact of facts) {
      const key = `${fact.subjectId}_${fact.relationship}_${fact.objectId}`;
      
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        // Merge properties
        existing.properties = { ...existing.properties, ...fact.properties };
        // Update validity
        if (!existing.validUntil || fact.validUntil! > existing.validUntil) {
          existing.validUntil = fact.validUntil;
        }
      } else {
        merged.set(key, { ...fact });
      }
    }
    
    return Array.from(merged.values());
  }
}

export default JasaWebTempMemory;