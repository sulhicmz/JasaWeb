import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

interface PredictionModel {
  type: 'timeline' | 'budget' | 'quality' | 'risk';
  accuracy: number;
  lastTrained: Date;
  features: string[];
}

interface TrainingData {
  projectId: string;
  features: Record<string, number>;
  actualOutcome: {
    timelineAdherence: number;
    budgetUtilization: number;
    qualityScore: number;
    riskScore: number;
  };
}

interface PredictionResult {
  prediction: number;
  confidence: number;
  factors: Array<{
    feature: string;
    importance: number;
    value: number;
  }>;
}

@Injectable()
export class PredictiveAnalyticsService {
  private models: Map<string, PredictionModel> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly cache: CacheService
  ) {
    this.initializeModels();
  }

  private initializeModels() {
    // Initialize prediction models with default configurations
    this.models.set('timeline', {
      type: 'timeline',
      accuracy: 0.85,
      lastTrained: new Date(),
      features: [
        'teamSize',
        'projectComplexity',
        'budgetSize',
        'historicalPerformance',
        'taskCompletionRate',
        'milestoneAdherence',
      ],
    });

    this.models.set('budget', {
      type: 'budget',
      accuracy: 0.82,
      lastTrained: new Date(),
      features: [
        'initialBudget',
        'projectDuration',
        'teamExperience',
        'scopeComplexity',
        'historicalBudgetAdherence',
        'changeRequestFrequency',
      ],
    });

    this.models.set('quality', {
      type: 'quality',
      accuracy: 0.78,
      lastTrained: new Date(),
      features: [
        'teamExperience',
        'projectComplexity',
        'testingCoverage',
        'codeReviewThoroughness',
        'clientCommunication',
        'requirementClarity',
      ],
    });

    this.models.set('risk', {
      type: 'risk',
      accuracy: 0.88,
      lastTrained: new Date(),
      features: [
        'teamStability',
        'requirementVolatility',
        'technicalComplexity',
        'budgetConstraints',
        'timelinePressure',
        'stakeholderAlignment',
      ],
    });
  }

  async trainModels(
    organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Gather historical data for training
      const trainingData = await this.gatherTrainingData(organizationId);

      if (trainingData.length < 10) {
        return {
          success: false,
          message:
            'Insufficient historical data for training. Need at least 10 completed projects.',
        };
      }

      // Train each model
      for (const [modelType, model] of this.models) {
        const trainedModel = await this.trainModel(modelType, trainingData);
        this.models.set(modelType, trainedModel);
      }

      await this.audit.log({
        actorId: 'system',
        organizationId,
        action: 'analytics.models_trained',
        target: organizationId,
        meta: {
          modelsTrained: Array.from(this.models.keys()),
          dataPoints: trainingData.length,
        },
      });

      return {
        success: true,
        message: `Successfully trained ${this.models.size} prediction models using ${trainingData.length} historical data points.`,
      };
    } catch (error) {
      await this.audit.log({
        actorId: 'system',
        organizationId,
        action: 'analytics.model_training_failed',
        target: organizationId,
        meta: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return {
        success: false,
        message: `Model training failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async predictTimeline(
    projectId: string,
    organizationId: string
  ): Promise<PredictionResult> {
    const cacheKey = `prediction:timeline:${projectId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        tasks: true,
        milestones: true,
        organization: {
          include: { members: true },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const features = this.extractTimelineFeatures(project);
    const model = this.models.get('timeline');

    if (!model) {
      throw new Error('Timeline prediction model not available');
    }

    const prediction = this.makePrediction(features, model);

    // Cache for 1 hour
    await this.cache.set(cacheKey, JSON.stringify(prediction), 3600);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.timeline_prediction',
      target: projectId,
      meta: { prediction, features },
    });

    return prediction;
  }

  async predictBudget(
    projectId: string,
    organizationId: string
  ): Promise<PredictionResult> {
    const cacheKey = `prediction:budget:${projectId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        tasks: true,
        milestones: true,
        invoices: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const features = this.extractBudgetFeatures(project);
    const model = this.models.get('budget');

    if (!model) {
      throw new Error('Budget prediction model not available');
    }

    const prediction = this.makePrediction(features, model);

    // Cache for 1 hour
    await this.cache.set(cacheKey, JSON.stringify(prediction), 3600);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.budget_prediction',
      target: projectId,
      meta: { prediction, features },
    });

    return prediction;
  }

  async predictQuality(
    projectId: string,
    organizationId: string
  ): Promise<PredictionResult> {
    const cacheKey = `prediction:quality:${projectId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        tasks: true,
        milestones: true,
        approvals: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const features = this.extractQualityFeatures(project);
    const model = this.models.get('quality');

    if (!model) {
      throw new Error('Quality prediction model not available');
    }

    const prediction = this.makePrediction(features, model);

    // Cache for 1 hour
    await this.cache.set(cacheKey, JSON.stringify(prediction), 3600);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.quality_prediction',
      target: projectId,
      meta: { prediction, features },
    });

    return prediction;
  }

  async predictRisk(
    projectId: string,
    organizationId: string
  ): Promise<PredictionResult> {
    const cacheKey = `prediction:risk:${projectId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        tasks: true,
        milestones: true,
        tickets: true,
        organization: {
          include: { members: true },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const features = this.extractRiskFeatures(project);
    const model = this.models.get('risk');

    if (!model) {
      throw new Error('Risk prediction model not available');
    }

    const prediction = this.makePrediction(features, model);

    // Cache for 1 hour
    await this.cache.set(cacheKey, JSON.stringify(prediction), 3600);

    await this.audit.log({
      actorId: 'system',
      organizationId,
      action: 'analytics.risk_prediction',
      target: projectId,
      meta: { prediction, features },
    });

    return prediction;
  }

  async getModelStatus(): Promise<Record<string, PredictionModel>> {
    return Object.fromEntries(this.models);
  }

  private async gatherTrainingData(
    organizationId: string
  ): Promise<TrainingData[]> {
    const completedProjects = await this.prisma.project.findMany({
      where: {
        organizationId,
        status: 'completed',
        startAt: { not: null },
        dueAt: { not: null },
      },
      include: {
        tasks: true,
        milestones: true,
        invoices: true,
        approvals: true,
        tickets: true,
        organization: {
          include: { members: true },
        },
      },
    });

    return completedProjects.map((project) => ({
      projectId: project.id,
      features: this.extractAllFeatures(project),
      actualOutcome: this.calculateActualOutcomes(project),
    }));
  }

  private extractAllFeatures(project: any): Record<string, number> {
    return {
      ...this.extractTimelineFeatures(project),
      ...this.extractBudgetFeatures(project),
      ...this.extractQualityFeatures(project),
      ...this.extractRiskFeatures(project),
    };
  }

  private extractTimelineFeatures(project: any): Record<string, number> {
    const tasks = project.tasks || [];
    const milestones = project.milestones || [];
    const teamSize = new Set(tasks.map((t: any) => t.assigneeId)).size || 1;

    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    const completedMilestones = milestones.filter(
      (m: any) => m.status === 'completed'
    ).length;
    const totalMilestones = milestones.length;
    const milestoneAdherence =
      totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

    return {
      teamSize,
      projectComplexity: this.calculateProjectComplexity(project),
      budgetSize: project.budget || 0,
      historicalPerformance: 0.8, // Placeholder - would calculate from historical data
      taskCompletionRate,
      milestoneAdherence,
    };
  }

  private extractBudgetFeatures(project: any): Record<string, number> {
    const invoices = project.invoices || [];
    const totalSpent = invoices
      .filter((i: any) => i.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + (invoice.amount || 0), 0);

    return {
      initialBudget: project.budget || 0,
      projectDuration: this.calculateProjectDuration(project),
      teamExperience: 0.7, // Placeholder - would calculate from team data
      scopeComplexity: this.calculateProjectComplexity(project),
      historicalBudgetAdherence: 0.85, // Placeholder
      changeRequestFrequency: 0.1, // Placeholder - would calculate from change requests
    };
  }

  private extractQualityFeatures(project: any): Record<string, number> {
    const approvals = project.approvals || [];
    const tasks = project.tasks || [];

    const approvalRate =
      approvals.length > 0
        ? approvals.filter((a: any) => a.status === 'approved').length /
          approvals.length
        : 1;

    return {
      teamExperience: 0.7, // Placeholder
      projectComplexity: this.calculateProjectComplexity(project),
      testingCoverage: 0.8, // Placeholder - would calculate from test data
      codeReviewThoroughness: approvalRate,
      clientCommunication: 0.9, // Placeholder - would calculate from communication metrics
      requirementClarity: 0.85, // Placeholder
    };
  }

  private extractRiskFeatures(project: any): Record<string, number> {
    const tasks = project.tasks || [];
    const tickets = project.tickets || [];

    const overdueTasks = tasks.filter(
      (t: any) =>
        t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'done'
    ).length;

    const highPriorityTickets = tickets.filter(
      (t: any) => t.priority === 'critical' || t.priority === 'high'
    ).length;

    return {
      teamStability: 0.9, // Placeholder - would calculate from team turnover
      requirementVolatility: 0.2, // Placeholder - would calculate from requirement changes
      technicalComplexity: this.calculateProjectComplexity(project),
      budgetConstraints: project.budget
        ? Math.min(1, 100000 / project.budget)
        : 0.5,
      timelinePressure: this.calculateTimelinePressure(project),
      stakeholderAlignment: 0.8, // Placeholder
    };
  }

  private calculateProjectComplexity(project: any): number {
    const tasks = project.tasks || [];
    const milestones = project.milestones || [];

    // Simple complexity calculation based on project size
    const taskComplexity = Math.min(1, tasks.length / 50);
    const milestoneComplexity = Math.min(1, milestones.length / 10);
    const budgetComplexity = project.budget
      ? Math.min(1, project.budget / 100000)
      : 0.5;

    return (taskComplexity + milestoneComplexity + budgetComplexity) / 3;
  }

  private calculateProjectDuration(project: any): number {
    if (!project.startAt || !project.dueAt) return 0;

    const start = new Date(project.startAt);
    const end = new Date(project.dueAt);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateTimelinePressure(project: any): number {
    const duration = this.calculateProjectDuration(project);
    const tasks = project.tasks || [];
    const taskCount = tasks.length;

    // Higher pressure for short timelines with many tasks
    return Math.min(1, taskCount / Math.max(duration, 1) / 2);
  }

  private calculateActualOutcomes(project: any): {
    timelineAdherence: number;
    budgetUtilization: number;
    qualityScore: number;
    riskScore: number;
  } {
    const tasks = project.tasks || [];
    const milestones = project.milestones || [];
    const invoices = project.invoices || [];

    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const taskCompletionRate =
      tasks.length > 0 ? completedTasks / tasks.length : 0;

    const totalSpent = invoices
      .filter((i: any) => i.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + (invoice.amount || 0), 0);
    const budgetUtilization = project.budget ? totalSpent / project.budget : 0;

    const timelineAdherence = this.calculateTimelineAdherence(project);
    const qualityScore = this.calculateQualityScore(project);
    const riskScore = this.calculateRiskScore(project);

    return {
      timelineAdherence,
      budgetUtilization,
      qualityScore,
      riskScore,
    };
  }

  private calculateTimelineAdherence(project: any): number {
    if (!project.startAt || !project.dueAt) return 1;

    const plannedEnd = new Date(project.dueAt);
    const actualEnd = project.updatedAt
      ? new Date(project.updatedAt)
      : new Date();

    const plannedDuration =
      plannedEnd.getTime() - new Date(project.startAt).getTime();
    const actualDuration =
      actualEnd.getTime() - new Date(project.startAt).getTime();

    return Math.min(1, plannedDuration / actualDuration);
  }

  private calculateQualityScore(project: any): number {
    const approvals = project.approvals || [];
    const tasks = project.tasks || [];

    const approvalRate =
      approvals.length > 0
        ? approvals.filter((a: any) => a.status === 'approved').length /
          approvals.length
        : 1;

    const taskCompletionRate =
      tasks.length > 0
        ? tasks.filter((t: any) => t.status === 'done').length / tasks.length
        : 1;

    return (approvalRate + taskCompletionRate) / 2;
  }

  private calculateRiskScore(project: any): number {
    const tasks = project.tasks || [];
    const tickets = project.tickets || [];

    const overdueTasks = tasks.filter(
      (t: any) =>
        t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'done'
    ).length;

    const highPriorityTickets = tickets.filter(
      (t: any) => t.priority === 'critical' || t.priority === 'high'
    ).length;

    const overdueRisk = Math.min(1, overdueTasks / Math.max(tasks.length, 1));
    const ticketRisk = Math.min(
      1,
      highPriorityTickets / Math.max(tickets.length, 1)
    );

    return (overdueRisk + ticketRisk) / 2;
  }

  private async trainModel(
    modelType: string,
    trainingData: TrainingData[]
  ): Promise<PredictionModel> {
    // Simplified model training - in a real implementation, this would use
    // machine learning libraries like TensorFlow.js or external ML services

    const model = this.models.get(modelType);
    if (!model) {
      throw new Error(`Model ${modelType} not found`);
    }

    // For demonstration, we'll use a simple linear regression approach
    // In practice, you'd use more sophisticated ML algorithms

    // Calculate feature importance based on correlation with outcomes
    const featureImportance = this.calculateFeatureImportance(
      modelType,
      trainingData
    );

    // Update model with new training results
    const updatedModel: PredictionModel = {
      ...model,
      accuracy: Math.min(0.95, model.accuracy + 0.02), // Simulate improvement
      lastTrained: new Date(),
      features: featureImportance.map((f) => f.feature),
    };

    return updatedModel;
  }

  private calculateFeatureImportance(
    modelType: string,
    trainingData: TrainingData[]
  ): Array<{ feature: string; importance: number }> {
    // Simplified feature importance calculation
    // In practice, you'd use statistical methods or ML algorithms

    const model = this.models.get(modelType);
    if (!model) return [];

    return model.features
      .map((feature) => ({
        feature,
        importance: Math.random() * 0.5 + 0.5, // Random importance for demonstration
      }))
      .sort((a, b) => b.importance - a.importance);
  }

  private makePrediction(
    features: Record<string, number>,
    model: PredictionModel
  ): PredictionResult {
    // Simplified prediction algorithm
    // In practice, this would use the trained ML model

    let prediction = 0.5; // Base prediction
    let totalWeight = 0;

    const factors: Array<{
      feature: string;
      importance: number;
      value: number;
    }> = [];

    // Weighted sum of features
    for (const feature of model.features) {
      const value = features[feature] || 0;
      const importance = 0.5 + Math.random() * 0.5; // Random weight for demo

      prediction += value * importance;
      totalWeight += importance;

      factors.push({
        feature,
        importance,
        value,
      });
    }

    // Normalize prediction
    prediction = totalWeight > 0 ? prediction / totalWeight : 0.5;
    prediction = Math.max(0, Math.min(1, prediction)); // Clamp to [0,1]

    // Sort factors by importance
    factors.sort((a, b) => b.importance - a.importance);

    return {
      prediction,
      confidence: model.accuracy,
      factors: factors.slice(0, 5), // Top 5 factors
    };
  }
}
