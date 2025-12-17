import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

export interface CacheInvalidationRule {
  pattern: string;
  triggers: Array<{
    entity: string;
    action: 'create' | 'update' | 'delete';
    fields?: string[];
  }>;
}

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);
  private readonly invalidationRules: Map<string, CacheInvalidationRule[]> =
    new Map();

  constructor(private readonly cacheService: CacheService) {
    this.initializeRules();
  }

  /**
   * Initialize cache invalidation rules
   */
  private initializeRules() {
    // Project-related invalidations
    this.addRule('projects', {
      pattern: 'projects:*',
      triggers: [
        { entity: 'project', action: 'create' },
        { entity: 'project', action: 'update' },
        { entity: 'project', action: 'delete' },
        { entity: 'milestone', action: 'create' },
        { entity: 'milestone', action: 'update' },
        { entity: 'milestone', action: 'delete' },
        { entity: 'task', action: 'create' },
        { entity: 'task', action: 'update' },
        { entity: 'task', action: 'delete' },
      ],
    });

    // Dashboard stats invalidations
    this.addRule('dashboard', {
      pattern: 'dashboard:*',
      triggers: [
        { entity: 'project', action: 'create' },
        { entity: 'project', action: 'update' },
        { entity: 'project', action: 'delete' },
        { entity: 'ticket', action: 'create' },
        { entity: 'ticket', action: 'update' },
        { entity: 'ticket', action: 'delete' },
        { entity: 'invoice', action: 'create' },
        { entity: 'invoice', action: 'update' },
        { entity: 'invoice', action: 'delete' },
        { entity: 'milestone', action: 'create' },
        { entity: 'milestone', action: 'update' },
        { entity: 'milestone', action: 'delete' },
      ],
    });

    // Project-specific invalidations
    this.addRule('project-detail', {
      pattern: 'project:*',
      triggers: [
        {
          entity: 'project',
          action: 'update',
          fields: ['status', 'name', 'description'],
        },
        { entity: 'milestone', action: 'create' },
        { entity: 'milestone', action: 'update' },
        { entity: 'milestone', action: 'delete' },
        { entity: 'task', action: 'create' },
        { entity: 'task', action: 'update' },
        { entity: 'task', action: 'delete' },
      ],
    });

    // User-specific invalidations
    this.addRule('user-profile', {
      pattern: 'user:*',
      triggers: [
        { entity: 'user', action: 'update' },
        { entity: 'organization', action: 'update' },
      ],
    });

    // Ticket-related invalidations
    this.addRule('tickets', {
      pattern: 'tickets:*',
      triggers: [
        { entity: 'ticket', action: 'create' },
        { entity: 'ticket', action: 'update' },
        { entity: 'ticket', action: 'delete' },
      ],
    });

    // Invoice-related invalidations
    this.addRule('invoices', {
      pattern: 'invoices:*',
      triggers: [
        { entity: 'invoice', action: 'create' },
        { entity: 'invoice', action: 'update' },
        { entity: 'invoice', action: 'delete' },
      ],
    });

    this.logger.debug('Cache invalidation rules initialized');
  }

  /**
   * Add invalidation rule
   */
  private addRule(name: string, rule: CacheInvalidationRule) {
    if (!this.invalidationRules.has(name)) {
      this.invalidationRules.set(name, []);
    }
    this.invalidationRules.get(name)!.push(rule);
  }

  /**
   * Invalidate cache based on entity change
   */
  async invalidateOnEntityChange(
    entity: string,
    action: 'create' | 'update' | 'delete',
    entityId?: string,
    organizationId?: string,
    changedFields?: string[]
  ): Promise<void> {
    this.logger.debug(`Cache invalidation triggered: ${entity} ${action}`, {
      entityId,
      organizationId,
      changedFields,
    });

    const patternsToInvalidate: string[] = [];

    // Find all rules that match this entity change
    for (const [, rules] of this.invalidationRules.entries()) {
      for (const rule of rules) {
        const matchingTrigger = rule.triggers.find(
          (trigger) => trigger.entity === entity && trigger.action === action
        );

        if (matchingTrigger) {
          // Check if specific field changes matter
          if (action === 'update' && matchingTrigger.fields) {
            const hasFieldChange = changedFields?.some((field) =>
              matchingTrigger.fields!.includes(field)
            );
            if (!hasFieldChange) {
              continue; // Skip this rule if fields don't match
            }
          }

          patternsToInvalidate.push(rule.pattern);
        }
      }
    }

    // Invalidate organization-specific patterns
    if (organizationId) {
      const orgPatterns = patternsToInvalidate.map((pattern) =>
        pattern.replace('*', `*:org:${organizationId}`)
      );
      patternsToInvalidate.push(...orgPatterns);
    }

    // Invalidate entity-specific pattern
    if (entityId) {
      const entityPattern = `${entity}:${entityId}`;
      if (organizationId) {
        patternsToInvalidate.push(`${entityPattern}:org:${organizationId}`);
      }
      patternsToInvalidate.push(entityPattern);
    }

    // Execute invalidations
    const invalidationPromises = patternsToInvalidate.map((pattern) =>
      this.cacheService.invalidatePattern(pattern)
    );

    if (invalidationPromises.length > 0) {
      await Promise.allSettled(invalidationPromises);
      this.logger.debug(
        `Cache invalidation completed: ${patternsToInvalidate.length} patterns invalidated`
      );
    }
  }

  /**
   * Invalidate cache for specific organization
   */
  async invalidateOrganizationCache(organizationId: string): Promise<void> {
    const patterns = [
      `*:org:${organizationId}`,
      `projects:*:org:${organizationId}`,
      `dashboard:*:org:${organizationId}`,
      `tickets:*:org:${organizationId}`,
      `invoices:*:org:${organizationId}`,
      `user:*:org:${organizationId}`,
    ];

    const invalidationPromises = patterns.map((pattern) =>
      this.cacheService.invalidatePattern(pattern)
    );

    await Promise.allSettled(invalidationPromises);
    this.logger.debug(`Organization cache invalidated: ${organizationId}`);
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(
    userId: string,
    organizationId?: string
  ): Promise<void> {
    const userKey = this.cacheService.generateUserKey(
      'profile',
      userId,
      organizationId
    );
    await this.cacheService.del(userKey);

    // Invalidate user dashboard
    const dashboardKey = this.cacheService.generateUserKey(
      'dashboard',
      userId,
      organizationId
    );
    await this.cacheService.del(dashboardKey);

    this.logger.debug(`User cache invalidated: ${userId}`, { organizationId });
  }

  /**
   * Invalidate project cache
   */
  async invalidateProjectCache(
    projectId: string,
    organizationId?: string
  ): Promise<void> {
    const projectKey = this.cacheService.generateProjectKey(
      'detail',
      projectId,
      organizationId
    );
    await this.cacheService.del(projectKey);

    // Invalidate project lists and dashboard stats
    await this.invalidateOnEntityChange(
      'project',
      'update',
      projectId,
      organizationId
    );

    this.logger.debug(`Project cache invalidated: ${projectId}`, {
      organizationId,
    });
  }

  /**
   * Warm up cache after invalidation (optional)
   */
  async warmupCache(
    entity: string,
    entityId: string,
    organizationId: string,
    data: unknown
  ): Promise<void> {
    const cacheKey = this.cacheService.generateKey(
      entity,
      entityId,
      organizationId
    );
    await this.cacheService.set(cacheKey, data, 1800); // 30 minutes TTL
    this.logger.debug(`Cache warmed up for: ${cacheKey}`);
  }

  /**
   * Get cache invalidation statistics
   */
  async getInvalidationStats(): Promise<Record<string, unknown>> {
    return {
      rulesCount: this.invalidationRules.size,
      rules: Array.from(this.invalidationRules.entries()).map(
        ([name, rules]) => ({
          name,
          patternsCount: rules.length,
          patterns: rules.map((r) => r.pattern),
        })
      ),
    };
  }

  /**
   * Add custom invalidation rule at runtime
   */
  addInvalidationRule(name: string, rule: CacheInvalidationRule): void {
    this.addRule(name, rule);
    this.logger.debug(`Custom invalidation rule added: ${name}`);
  }

  /**
   * Remove invalidation rule
   */
  removeInvalidationRule(name: string): boolean {
    const removed = this.invalidationRules.delete(name);
    if (removed) {
      this.logger.debug(`Invalidation rule removed: ${name}`);
    }
    return removed;
  }
}
