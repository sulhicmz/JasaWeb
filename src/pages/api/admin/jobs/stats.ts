import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

    const stats = await JobQueueService.getJobStats();
    return jsonResponse(stats);
} catch (_) {$
    return errorResponse('Failed to fetch job stats', 500);
  }
};
