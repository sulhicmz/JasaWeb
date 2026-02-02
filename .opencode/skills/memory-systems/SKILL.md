---
name: memory-systems
description: Implement persistent memory for agents with temporal knowledge graphs, entity tracking, and cross-session learning. Use when building agents that need to maintain continuity across sessions, track entity relationships, or implement knowledge graphs for JasaWeb autonomous agents.
license: MIT
compatibility: opencode
metadata:
  audience: ai-engineers
  workflow: agent-development
  category: memory-architecture
---

## What I do
- Design temporal knowledge graph architectures
- Implement entity tracking and relationship persistence
- Create memory layers for agent continuity
- Enable cross-session learning and pattern recognition
- Optimize memory retrieval for JasaWeb performance standards
- Establish memory consolidation and evolution strategies

## When to use me
Use when implementing agent memory, designing persistent state systems, creating knowledge graphs, tracking entities across sessions, building temporal reasoning capabilities, or developing autonomous learning systems for JasaWeb.

## JasaWeb Memory Architecture

### Recommended: Temporal Knowledge Graph
```typescript
interface MemoryConfig {
  layers: [
    {
      type: "working"
      implementation: "context_window"
      capacity: "128K tokens"
      persistence: "session_only"
    },
    {
      type: "short_term"
      implementation: "session_db"
      capacity: "unlimited"
      persistence: "session_persistent"
    },
    {
      type: "long_term"
      implementation: "temporal_knowledge_graph"
      database: "postgres_with_graph_features"
      schema: "entity_relationship_temporal"
    }
  ]
  consolidation: {
    trigger: "memory_growth > 1000_nodes"
    frequency: "weekly"
    strategy: "merge_related_facts"
  }
}
```

### Implementation Classes

#### Entity Memory
```typescript
interface Entity {
  id: string
  type: 'user' | 'project' | 'service' | 'component' | 'test' | 'issue'
  properties: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

interface TemporalFact {
  id: string
  subjectId: string
  relationship: string
  objectId: string
  properties: Record<string, any>
  validFrom: Date
  validUntil?: Date
  createdAt: Date
}

class JasaWebTemporalMemory {
  private db: Database // PostgreSQL with graph capabilities
  
  async storeFact(
    entity_id: string,
    relationship: string,
    target: string,
    properties: Record<string, any>,
    valid_from: Date,
    valid_until?: Date
  ): Promise<TemporalFact>
  
  async queryEntityState(
    entity_id: string,
    at_time: Date
  ): Promise<EntityState>
  
  async getEntityHistory(entity_id: string): Promise<TemporalFact[]>
}
```

## Memory Use Cases for JasaWeb

### 1. Architectural Knowledge Retention
```typescript
// Track successful architectural patterns
await memory.storeFact(
  'service_layer_pattern',
  'HAS_SUCCESS_RATE',
  '99.8',
  { 
    pattern: 'atomic_services', 
    score: 99.8, 
    implementation_count: 28 
  },
  new Date('2025-01-01')
);
```

### 2. Component Evolution Tracking
```typescript
// Track how components evolve over time
await memory.storeFact(
  'billing_component',
  'EVOLVED_TO',
  'modular_service_architecture',
  { 
    previous: 'monolithic_663_lines',
    current: '4_atomic_services',
    improvement: 'eliminated_400_lines_duplication'
  },
  new Date('2025-12-21')
);
```

### 3. Fix Pattern Learning
```typescript
// Learn from successful debugging attempts
await memory.learnFromFix(
  'test_regression',
  'dependency_version_mismatch',
  'success',
  0.95
);
```

### 4. Performance Baseline Updates
```typescript
// Update performance expectations
await memory.storeFact(
  'jasaweb_performance',
  'HAS_QUERY_EXPECTATION',
  'sub_2ms',
  { 
    target_ms: 2, 
    actual_avg: 1.1, 
    record_count: '1500+' 
  },
  new Date()
);
```

## Memory Integration Patterns

### Service Layer Integration
```typescript
abstract class MemoryAwareService {
  protected memory: JasaWebTemporalMemory;
  
  constructor(memory: JasaWebTemporalMemory) {
    this.memory = memory;
  }
  
  // Learn from service interactions
  protected async learnFromInteraction(
    operation: string,
    context: Record<string, any>,
    outcome: 'success' | 'failure'
  ): Promise<void> {
    await this.memory.storeFact(
      this.constructor.name,
      'PERFORMED_OPERATION',
      operation,
      { context, outcome, timestamp: new Date().toISOString() },
      new Date()
    );
  }
}
```

### Autonomous Agent Memory
```typescript
class JasaWebAutonomousAgent {
  private memory: JasaWebTemporalMemory;
  
  async healSystem(): Promise<void> {
    // Check memory for similar past issues
    const similarIssues = await this.memory.queryEntityState(
      'system_failure',
      new Date()
    );
    
    // Apply successful patterns from memory
    const successfulFixes = similarIssues.relationships
      .filter(r => r.properties.outcome === 'success');
    
    if (successfulFixes.length > 0) {
      await this.applyFixPattern(successfulFixes[0]);
    }
  }
  
  async evolveSystem(): Promise<void> {
    // Analyze historical evolution patterns
    const evolutionHistory = await this.memory.getEntityHistory('jasaweb_evolution');
    
    // Identify successful strategies
    const successfulEvolutions = evolutionHistory.filter(
      fact => fact.properties.outcome === 'success'
    );
    
    await this.applyEvolutionPattern(successfulEvolutions);
  }
}
```

## Memory Retrieval Patterns

### Semantic Retrieval
```typescript
async retrieveBySemanticSimilarity(
  query: string,
  limit: number = 10
): Promise<TemporalFact[]> {
  // Use embedding similarity search
  // Filter for valid temporal facts
  // Return most relevant memories
}
```

### Entity-Based Retrieval
```typescript
async retrieveEntityMemories(
  entity_id: string,
  time_range?: { from: Date, to: Date }
): Promise<EntityState[]> {
  // Traverse entity relationships
  // Apply temporal filters
  // Return complete entity history
}
```

### Temporal Retrieval
```typescript
async retrieveTemporalRange(
  from_time: Date,
  to_time: Date,
  entity_types?: string[]
): Promise<TemporalFact[]> {
  // Query facts within time range
  // Filter by entity types
  // Return chronological memories
}
```

## Performance Considerations

### Retrieval Optimization
```typescript
class OptimizedMemoryRetrieval {
  private entityCache = new Map<string, Entity>();
  
  async getEntityWithCache(entityId: string): Promise<Entity> {
    if (this.entityCache.has(entityId)) {
      return this.entityCache.get(entityId)!;
    }
    
    const entity = await this.loadEntity(entityId);
    this.entityCache.set(entityId, entity);
    return entity;
  }
  
  async batchConsolidation(): Promise<void> {
    const batch = await this.getStaleMemories(1000);
    
    await Promise.all(
      batch.map(memory => this.consolidateMemory(memory))
    );
  }
}
```

### Memory Consolidation
```typescript
interface ConsolidationStrategy {
  trigger: string
  frequency: string
  strategy: string
}

class MemoryConsolidation {
  async consolidateMemories(): Promise<void> {
    // 1. Identify outdated facts
    const outdatedFacts = await this.findOutdatedFacts();
    
    // 2. Merge related facts
    const mergedFacts = await this.mergeRelatedFacts(outdatedFacts);
    
    // 3. Update validity periods
    await this.updateValidityPeriods(mergedFacts);
    
    // 4. Archive obsolete data
    await this.archiveObsoleteData();
  }
}
```

## Security & Privacy

### Access Control
```typescript
class SecureMemoryAccess {
  async storeSecureFact(
    user_id: string,
    fact: TemporalFact
  ): Promise<void> {
    // Encrypt sensitive memory data
    const encrypted = await this.encrypt(fact.properties);
    
    // Store with access controls
    await this.memory.storeFact(
      user_id,
      fact.relationship,
      fact.objectId,
      encrypted,
      fact.validFrom,
      fact.validUntil
    );
  }
  
  async retrieveSecureFacts(
    user_id: string,
    query: MemoryQuery
  ): Promise<TemporalFact[]> {
    // Verify access permissions
    await this.validateAccess(user_id, query);
    
    // Retrieve and decrypt
    const facts = await this.memory.query(query);
    return Promise.all(
      facts.map(fact => this.decrypt(fact))
    );
  }
}
```

### Memory Validation
```typescript
class MemoryQualityAssurance {
  async validateMemoryIntegrity(): Promise<ValidationReport> {
    // Check temporal consistency
    const inconsistencies = await this.findTemporalInconsistencies();
    
    // Validate relationship integrity
    const orphanedFacts = await this.findOrphanedFacts();
    
    // Check memory growth metrics
    const growthAnalysis = await this.analyzeMemoryGrowth();
    
    return {
      inconsistencies,
      orphanedFacts,
      growthAnalysis,
      overallHealth: this.calculateHealthScore(inconsistencies, orphanedFacts)
    };
  }
}
```

## Memory System Evaluation

### Success Metrics
- **Retrieval Accuracy**: 94.8% (based on DMR benchmark)
- **Retrieval Latency**: 2.58s vs 28.9s (90% faster than context-only)
- **Learning Rate**: Continuous improvement in fix success rate
- **Pattern Recognition**: Enhanced decision-making over time

### Quality Standards
- Zero data loss during consolidation
- Sub-millisecond memory retrieval for active use cases
- Secure access control for sensitive data
- Compliance with JasaWeb 99.8/100 architectural standards

## Integration Steps

1. **Initialize Memory System**: Set up temporal knowledge graph database
2. **Create Memory Service**: Implement JasaWebTemporalMemory class  
3. **Integrate with Agents**: Add memory capabilities to autonomous agents
4. **Establish Learning Patterns**: Define what to learn and apply
5. **Setup Monitoring**: Track memory system performance and health
6. **Continuous Improvement**: Regular consolidation and optimization

## Examples

When asked to implement memory for a JasaWeb agent:

1. **Requirements Analysis**: Understand entity types and relationships
2. **Schema Design**: Create temporal fact schema
3. **Memory Layers**: Implement working, short-term, and long-term memory
4. **Learning Patterns**: Define success/failure tracking
5. **Performance Optimization**: Implement caching and indexing
6. **Security Measures**: Add access control and encryption

## Related Skills

- **systematic-debugging** - For debugging memory-related issues
- **backend-models** - For memory data modeling
- **skill-builder** - For creating memory-enabled skills

This memory system provides JasaWeb agents with persistent learning capabilities while maintaining worldclass architectural standards and security requirements.