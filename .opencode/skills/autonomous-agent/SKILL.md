---
name: autonomous-agent
description: Self-healing, self-learning, self-evolving agent with autonomous problem-solving, continuous improvement, and adaptive decision-making capabilities. Use when implementing agents that need to autonomously recover from errors, learn from interactions, and evolve their behavior over time.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: agent-development
  category: artificial-intelligence
---

## What I do
- Implement self-healing mechanisms for autonomous error recovery
- Design self-learning systems that improve from interactions
- Create self-evolving agents that adapt behavior over time
- Integrate continuous improvement loops and feedback systems
- Build resilient agents that maintain performance under changing conditions

## When to use me
Use when implementing autonomous agents, building self-healing systems, creating adaptive AI, designing learning mechanisms, or evolving agent behaviors based on experience.

## Autonomous Agent Architecture

### Core Principles

#### Self-Healing
```yaml
healing_mechanisms:
  error_detection: autonomous
  recovery_strategies: adaptive
  failure_analysis: systematic
  prevention_learning: continuous
```

**Autonomous Recovery Workflow:**
1. **Error Detection**: Monitor system health indicators
2. **Failure Analysis**: Identify root cause automatically
3. **Recovery Planning**: Generate and evaluate recovery strategies
4. **Implementation**: Execute recovery with validation
5. **Learning Update**: Store patterns for future prevention

#### Self-Learning
```yaml
learning_systems:
  interaction_analytics: continuous
  pattern_discovery: automated
  knowledge_extraction: real_time
  model_updates: incremental
```

**Learning Pipeline:**
1. **Data Collection**: Gather interaction data and outcomes
2. **Pattern Recognition**: Identify successful strategies
3. **Knowledge Integration**: Incorporate new insights
4. **Model Adaptation**: Update decision-making processes
5. **Performance Validation**: Test and refine improvements

#### Self-Evolving
```yaml
evolution_mechanisms:
  behavior_optimization: genetic
  strategy_adaptation: reinforcement
  architecture_evolution: modular
  goal_refinement: emergent
```

**Evolution Process:**
1. **Performance Assessment**: Evaluate current effectiveness
2. **Variation Generation**: Create behavioral mutations
3. **Selection Pressure**: Test against performance metrics
4. **Integration**: Incorporate successful adaptations
5. **Goal Evolution**: Refine objectives based on learning

## Implementation Patterns

### Self-Healing Agent Implementation

#### Error Monitoring System
```javascript
class HealthMonitor {
  constructor(agent) {
    this.agent = agent;
    this.metrics = new Map();
    this.thresholds = this.configureThresholds();
  }
  
  monitor() {
    // Track performance indicators
    const indicators = this.collectIndicators();
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(indicators);
    
    // Trigger healing if needed
    if (anomalies.length > 0) {
      this.initiateHealing(anomalies);
    }
  }
  
  async initiateHealing(anomalies) {
    for (const anomaly of anomalies) {
      const strategy = await this.generateRecoveryStrategy(anomaly);
      const success = await this.executeRecovery(strategy);
      
      if (success) {
        this.updateKnowledge(anomaly, strategy);
      } else {
        this.escalateRecovery(anomaly);
      }
    }
  }
}
```

#### Recovery Strategy Generation
```javascript
class RecoveryPlanner {
  async generateStrategy(anomaly) {
    // Analyze similar past incidents
    const similarIncidents = this.searchHistory(anomaly);
    
    // Generate candidate strategies
    const candidates = this.generateCandidates(anomaly, similarIncidents);
    
    // Evaluate strategies
    const evaluations = await this.evaluateStrategies(candidates);
    
    // Select best strategy
    return this.selectOptimalStrategy(evaluations);
  }
}
```

### Self-Learning System Implementation

#### Interaction Analytics
```javascript
class LearningAnalytics {
  constructor() {
    this.interactionLog = [];
    this.patterns = new Map();
    this.successMetrics = new Map();
  }
  
  recordInteraction(context, action, outcome) {
    const record = {
      timestamp: Date.now(),
      context: this.serializeContext(context),
      action: action,
      outcome: outcome,
      success: this.evaluateSuccess(outcome)
    };
    
    this.interactionLog.push(record);
    this.updatePatterns(record);
  }
  
  updatePatterns(record) {
    // Identify successful patterns
    if (record.success) {
      const pattern = this.extractPattern(record);
      this.patterns.set(pattern.key, pattern);
    }
  }
}
```

#### Continuous Model Updates
```javascript
class ContinuousLearning {
  constructor() {
    this.modelVersion = 1;
    this.updateThreshold = 100; // interactions
    this.performanceHistory = [];
  }
  
  shouldUpdate() {
    return this.interactionCount >= this.updateThreshold &&
           this.performanceImproved();
  }
  
  async updateModel() {
    // Collect training data
    const trainingData = this.prepareTrainingData();
    
    // Train new model version
    const newModel = await this.trainModel(trainingData);
    
    // Validate performance
    const performance = await this.validateModel(newModel);
    
    if (performance.betterThanCurrent()) {
      this.deployModel(newModel);
      this.modelVersion++;
    }
  }
}
```

### Self-Evolving Agent Implementation

#### Behavioral Evolution
```javascript
class BehaviorEvolution {
  constructor() {
    this.populationSize = 10;
    this.mutationRate = 0.1;
    this.eliteSize = 2;
    this.behaviors = this.initializeBehaviors();
  }
  
  evolve(generation) {
    // Evaluate current behaviors
    const fitness = this.evaluateBehaviors();
    
    // Select elite performers
    const elite = this.selectElite(fitness);
    
    // Generate new variations
    const offspring = this.generateOffspring(elite);
    
    // Create new generation
    this.behaviors = this.createNewGeneration(elite, offspring);
    
    return this.getBestBehavior();
  }
  
  generateOffspring(elite) {
    const offspring = [];
    
    while (offspring.length < this.populationSize - this.eliteSize) {
      const parent = this.selectParent(elite);
      const child = this.mutateBehavior(parent);
      offspring.push(child);
    }
    
    return offspring;
  }
}
```

#### Goal Refinement System
```javascript
class GoalEvolution {
  constructor(initialGoals) {
    this.goals = initialGoals;
    this.evolutionHistory = [];
    this.performanceMetrics = new Map();
  }
  
  refineGoals() {
    // Analyze goal achievement patterns
    const patterns = this.analyzeGoalPatterns();
    
    // Identify goal tensions
    const tensions = this.identifyGoalTensions(patterns);
    
    // Generate goal refinements
    const refinements = this.generateRefinements(tensions);
    
    // Validate and apply
    const validRefinements = this.validateRefinements(refinements);
    this.applyRefinements(validRefinements);
  }
}
```

## Integration with JasaWeb

### JasaWeb Autonomous Agent Configuration

```javascript
class JasawebAutonomousAgent {
  constructor() {
    this.architecture = {
      healing: {
        systems: ['error_recovery', 'performance_monitoring'],
        patterns: ['circuit_breaker', 'retry_with_backoff']
      },
      learning: {
        sources: ['user_interactions', 'system_metrics', 'outcomes'],
        methods: ['pattern_recognition', 'anomaly_detection']
      },
      evolution: {
        scope: ['decision_making', 'workflow_optimization'],
        constraints: ['jasaweb_architectural_compliance']
      }
    };
  }
  
  async autonomousOperation(task) {
    try {
      // Execute task with self-monitoring
      const result = await this.executeWithMonitoring(task);
      
      // Learn from interaction
      await this.recordLearning(task, result);
      
      // Update if beneficial
      await this.considerEvolution();
      
      return result;
    } catch (error) {
      // Self-heal and retry
      const healed = await this.attemptHealing(error);
      return healed || this.escalateIssue(error);
    }
  }
}
```

## Performance Metrics and Monitoring

### Self-Healing Metrics
```yaml
healing_kpi:
  mean_time_to_recovery: "< 5 seconds"
  recovery_success_rate: "> 95%"
  false_positive_rate: "< 5%"
  prevention_effectiveness: "increasing over time"
```

### Self-Learning Metrics
```yaml
learning_kpi:
  pattern_discovery_rate: "continuous"
  model_improvement_rate: "measurable per 100 interactions"
  prediction_accuracy: "improving over baseline"
  knowledge_retention: "> 90% over 30 days"
```

### Self-Evolution Metrics
```yaml
evolution_kpi:
  adaptation_speed: "measurable improvement per generation"
  fitness_progression: "monotonically increasing"
  stability_maintained: "no regression in core capabilities"
  emergence_detected: "novel behaviors arising"
```

## Advanced Features

### Hierarchical Self-Improvement
```javascript
class HierarchicalAutonomy {
  constructor() {
    this.layers = {
      tactical: new TacticalAutonomy(),    // Immediate responses
      operational: new OperationalAutonomy(), // Task optimization
      strategic: new StrategicAutonomy()   // Long-term evolution
    };
  }
  
  async coordinateImprovement() {
    // Bottom-up learning
    const tacticalInsights = await this.layers.tactical.learn();
    
    // Middle-up optimization
    const operationalUpdates = await this.layers.operational.optimize(tacticalInsights);
    
    // Top-down evolution
    const strategicEvolution = await this.layers.strategic.evolve(operationalUpdates);
    
    return this.synthesizeImprovements(tacticalInsights, operationalUpdates, strategicEvolution);
  }
}
```

### Multi-Agent Collaboration
```javascript
class CollaborativeEvolution {
  constructor() {
    this.agents = new Map();
    this.sharedKnowledge = new SharedKnowledgeBase();
    this.coordinationProtocols = new CoordinationProtocols();
  }
  
  async collaborativeLearning() {
    // Share successful patterns
    await this.shareSuccessPatterns();
    
    // Learn from others' failures
    await this.learnFromFailures();
    
    // Coordinate behavior evolution
    await this.coordinateEvolution();
  }
}
```

## Deployment and Scaling

### Production Configuration
```json
{
  "autonomous_agent": {
    "healing": {
      "enabled": true,
      "monitoring_interval": "1s",
      "recovery_timeout": "10s",
      "max_recovery_attempts": 3
    },
    "learning": {
      "enabled": true,
      "batch_size": 100,
      "update_frequency": "hourly",
      "retention_period": "30d"
    },
    "evolution": {
      "enabled": true,
      "generation_interval": "weekly",
      "population_size": 10,
      "mutation_rate": 0.1
    }
  }
}
```

### Scaling Considerations
- **Distributed Learning**: Share patterns across agent instances
- **Hierarchical Coordination**: Local autonomy with global coordination
- **Resource Management**: Balance computation with learning/evolution needs
- **Consensus Mechanisms**: Ensure coherent evolution in multi-agent systems

## Validation and Testing

### Self-Healing Validation
```javascript
class HealingValidation {
  async validateRecovery() {
    // Inject controlled failures
    const failures = this.generateTestFailures();
    
    // Verify recovery mechanisms
    const results = await this.testRecovery(failures);
    
    // Validate learning from failures
    const improvements = await this.verifyLearning(results);
    
    return {
      recovery_rate: this.calculateRecoveryRate(results),
      learning_effectiveness: this.measureLearning(improvements),
      overall_health: this.assessSystemHealth()
    };
  }
}
```

### Learning Effectiveness Testing
```javascript
class LearningValidation {
  async testLearningEffectiveness() {
    const baseline = this.benchmarkPerformance();
    
    // Run learning cycles
    await this.runLearningCycles(100);
    
    const postLearning = this.measurePerformance();
    
    return {
      improvement: postLearning.score - baseline.score,
      pattern_discovery: this.countDiscoveredPatterns(),
      adaptation_speed: this.measureAdaptationSpeed()
    };
  }
}
```

## Integration Checklist

Before deploying autonomous agents:

**Self-Healing:**
- [ ] Error monitoring systems implemented
- [ ] Recovery strategies defined and tested
- [ ] Learning from failures integrated
- [ ] Performance thresholds configured

**Self-Learning:**
- [ ] Data collection mechanisms in place
- [ ] Pattern recognition algorithms implemented
- [ ] Model update pipelines functional
- [ ] Performance validation automated

**Self-Evolving:**
- [ ] Behavior variation mechanisms active
- [ ] Fitness evaluation defined
- [ ] Evolution constraints established
- [ ] Goal refinement systems operational

**JasaWeb Compliance:**
- [ ] Architectural standards maintained (99.8/100 score)
- [ ] Security principles preserved (100/100 score)
- [ ] Development patterns followed
- [ ] Documentation standards met

This autonomous agent implementation creates self-healing, self-learning, and self-evolving systems while maintaining JasaWeb's worldclass architectural standards and security posture.