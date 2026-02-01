/**
 * Pattern Recognition API
 * 
 * Provides pattern analysis and recommendations for autonomous agents
 * Requires admin authentication
 */

import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, validateRequired, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/services/admin/auth';
import PatternRecognitionService from '@/services/autonomous/PatternRecognitionService';
import JasaWebTempMemory from '@/services/autonomous/JasaWebMemoryService';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Require admin authentication
    const authError = requireAdmin({ request, locals } as any);
    if (authError) return authError;

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    const taskId = url.searchParams.get('taskId');

    // Initialize services
    const memory = new JasaWebTempMemory(locals);
    const patternService = new PatternRecognitionService(memory);

    switch (action) {
      case 'stats': {
        const stats = patternService.getPatternStats();
        return jsonResponse({
          success: true,
          data: stats,
          meta: {
            timestamp: new Date().toISOString(),
            totalPatterns: stats.patterns.length,
            averageConfidence: stats.averageConfidence
          }
        });
      }

      case 'analyze': {
        const matches = await patternService.analyzeCodebase(locals);
        return jsonResponse({
          success: true,
          data: {
            matches: matches,
            summary: {
              totalMatches: matches.length,
              patternsDetected: matches.length,
              analyzedAt: new Date().toISOString()
            }
          }
        });
      }

      case 'recommendations': {
        if (!taskId) {
          return errorResponse('Task ID required for recommendations', 400);
        }

        // In a real implementation, this would fetch task details
        const mockTask = {
          type: 'feature_implementation',
          description: 'Add new API endpoint',
          affectedFiles: ['/src/pages/api/', '/src/services/']
        };

        const recommendations = await patternService.getRecommendations(locals, mockTask);
        return jsonResponse({
          success: true,
          data: {
            taskId,
            recommendations: recommendations,
            summary: {
              totalRecommendations: recommendations.length,
              averageConfidence: recommendations.reduce((a, r) => a + r.confidence, 0) / recommendations.length
            }
          }
        });
      }

      case 'validate': {
        const validation = await patternService.validatePatterns(locals);
        return jsonResponse({
          success: true,
          data: {
            validation: validation,
            summary: {
              valid: validation.valid.length,
              outdated: validation.outdated.length,
              needsAttention: validation.needsAttention.length,
              validationDate: new Date().toISOString()
            }
          }
        });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Require admin authentication
    const authError = requireAdmin({ request, locals } as any);
    if (authError) return authError;

    const body = await request.json();
    const { action } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['action']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    // Initialize services
    const memory = new JasaWebTempMemory(locals);
    const patternService = new PatternRecognitionService(memory);

    switch (action) {
      case 'learn': {
        const { operation, codeContext, outcome } = body;
        
        const learnValidationError = validateRequired(body, ['operation', 'codeContext', 'outcome']);
        if (learnValidationError) {
          return errorResponse(learnValidationError, 400);
        }

        await patternService.learnFromSuccess(locals, operation, codeContext, outcome);
        
        return jsonResponse({
          success: true,
          message: 'Learning successful',
          data: {
            operation,
            learnedAt: new Date().toISOString()
          }
        });
      }

      case 'store-pattern': {
        const { pattern } = body;
        
        const patternValidationError = validateRequired(body, ['pattern']);
        if (patternValidationError) {
          return errorResponse(patternValidationError, 400);
        }

        await memory.storeFact(
          'custom_pattern',
          'HAS_CHARACTERISTICS',
          pattern.id,
          {
            ...pattern,
            storedAt: new Date().toISOString()
          },
          new Date()
        );

        return jsonResponse({
          success: true,
          message: 'Pattern stored successfully',
          data: {
            patternId: pattern.id,
            storedAt: new Date().toISOString()
          }
        });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error) {
    return handleApiError(error);
  }
};