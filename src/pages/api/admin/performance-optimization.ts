/**
 * Performance Optimization Admin API
 * 
 * Provides administrative interface for monitoring and managing
 * the autonomous performance optimization engine.
 */

import { type APIRoute } from 'astro';
import { createPerformanceOptimizationService } from '@/services/autonomous/PerformanceOptimizationService';
import { validateRequired } from '@/lib/api';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get performance optimization service
    const optService = createPerformanceOptimizationService(
      locals.runtime.env?.CACHE as any
    );

    const url = new URL(request.url);
    const operation = url.searchParams.get('operation');

    switch (operation) {
      case 'summary': {
        // Get optimization summary
        const summary = optService.getOptimizationSummary();
        return jsonResponse(summary);
      }

      case 'strategies': {
        // Get all strategies
        const strategies = optService.getStrategies();
        return jsonResponse({ strategies, count: strategies.length });
      }

      case 'bottlenecks': {
        // Get bottlenecks with optional filtering
        const type = url.searchParams.get('type') || undefined;
        const severity = url.searchParams.get('severity') || undefined;
        const resolved = url.searchParams.get('resolved') === 'true';

        const bottlenecks = optService.getBottlenecks({
          type,
          severity,
          resolved
        });
        return jsonResponse({ bottlenecks, count: bottlenecks.length });
      }

      case 'scaling': {
        // Get scaling recommendations
        const recommendations = optService.getScalingRecommendations();
        return jsonResponse({ recommendations, count: recommendations.length });
      }

      case 'status': {
        // Get detailed status
        const detailedSummary = optService.getOptimizationSummary();
        const currentStrategies = optService.getStrategies();
        const currentBottlenecks = optService.getBottlenecks();
        const currentRecommendations = optService.getScalingRecommendations();

        return jsonResponse({
          summary: detailedSummary,
          strategies: currentStrategies,
          bottlenecks: currentBottlenecks,
          recommendations: currentRecommendations,
          timestamp: new Date().toISOString()
        });
      }

      default: {
        // Return default summary
        const defaultSummary = optService.getOptimizationSummary();
        return jsonResponse(defaultSummary);
      }
    }
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const optService = createPerformanceOptimizationService(
      locals.runtime.env?.CACHE as any
    );

    const operation = body.operation;

    switch (operation) {
      case 'start-engine':
        // Start the optimization engine
        optService.startOptimization();
        return jsonResponse({
          message: 'Performance optimization engine started',
          status: 'running',
          timestamp: new Date().toISOString()
        });

      case 'stop-engine':
        // Stop the optimization engine
        optService.stopOptimization();
        return jsonResponse({
          message: 'Performance optimization engine stopped',
          status: 'stopped',
          timestamp: new Date().toISOString()
        });

      case 'add-strategy': {
        const strategyError = validateRequired(body, ['strategy']);
        if (strategyError) return errorResponse(strategyError);

        optService.addStrategy(body.strategy);
        return jsonResponse({
          message: 'Optimization strategy added',
          strategy: body.strategy,
          timestamp: new Date().toISOString()
        });
      }

      case 'remove-strategy': {
        const removeError = validateRequired(body, ['strategyId']);
        if (removeError) return errorResponse(removeError);
        
        optService.removeStrategy(body.strategyId);
        return jsonResponse({
          message: 'Optimization strategy removed',
          strategyId: body.strategyId,
          timestamp: new Date().toISOString()
        });
      }

      case 'resolve-bottleneck': {
        const resolveError = validateRequired(body, ['bottleneckId']);
        if (resolveError) return errorResponse(resolveError);
        
        optService.resolveBottleneck(body.bottleneckId);
        return jsonResponse({
          message: 'Bottleneck marked as resolved',
          bottleneckId: body.bottleneckId,
          timestamp: new Date().toISOString()
        });
      }

      case 'run-optimization': {
        await (optService as any).runOptimizationCycle();
        return jsonResponse({
          message: 'Optimization cycle completed',
          timestamp: new Date().toISOString()
        });
      }

      case 'cache-optimization': {
        const cacheParams = body.parameters || {};
        await (optService as any).executeCacheOptimization(cacheParams);
        return jsonResponse({
          message: 'Cache optimization executed',
          parameters: cacheParams,
          timestamp: new Date().toISOString()
        });
      }

      case 'bundle-optimization': {
        const bundleParams = body.parameters || {};
        await (optService as any).executeBundleOptimization(bundleParams);
        return jsonResponse({
          message: 'Bundle optimization queued',
          parameters: bundleParams,
          timestamp: new Date().toISOString()
        });
      }

      default:
        return errorResponse('Invalid operation');
    }
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const optService = createPerformanceOptimizationService(
      locals.runtime.env?.CACHE as any
    );

    const operation = body.operation;

    switch (operation) {
      case 'update-strategy': {
        // Update existing strategy (remove and re-add)
        const updateError = validateRequired(body, ['strategyId', 'strategy']);
        if (updateError) return errorResponse(updateError);

        optService.removeStrategy(body.strategyId);
        optService.addStrategy(body.strategy);
        
        return jsonResponse({
          message: 'Optimization strategy updated',
          strategyId: body.strategyId,
          timestamp: new Date().toISOString()
        });
      }

      case 'batch-resolve': {
        const batchError = validateRequired(body, ['bottleneckIds']);
        if (batchError) return errorResponse(batchError);

        const resolvedIds: string[] = [];
        for (const id of body.bottleneckIds) {
          optService.resolveBottleneck(id);
          resolvedIds.push(id);
        }

        return jsonResponse({
          message: 'Bottlenecks resolved',
          resolvedIds,
          count: resolvedIds.length,
          timestamp: new Date().toISOString()
        });
      }

      default:
        return errorResponse('Invalid operation');
    }
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const optService = createPerformanceOptimizationService(
      locals.runtime.env?.CACHE as any
    );

    const operation = body.operation;

    switch (operation) {
      case 'clear-bottlenecks': {
        const currentBottlenecks = optService.getBottlenecks();
        const resolvedCount = currentBottlenecks.filter(b => b.resolved).length;
        
        return jsonResponse({
          message: `${resolvedCount} resolved bottlenecks would be cleared`,
          resolvedCount,
          timestamp: new Date().toISOString()
        });
      }

      default:
        return errorResponse('Invalid operation');
    }
  } catch (error) {
    return handleApiError(error);
  }
};