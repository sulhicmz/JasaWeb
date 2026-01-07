import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { JobQueueService } from '@/services/jobs/job-queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

    const rateLimit = await checkRateLimit(request, env, 'admin-jobs-stats');
    if (rateLimit) return rateLimit;

    const stats = await JobQueueService.getJobStats();
    return jsonResponse(stats);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch job stats' }, 500);
  }
};
