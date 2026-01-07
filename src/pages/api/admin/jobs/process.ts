import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse, validateRequired } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { JobQueueService } from '@/services/jobs/job-queue.service';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

    const rateLimit = await checkRateLimit(request, env, 'admin-jobs-process');
    if (rateLimit) return rateLimit;

    const body = await request.json();
    const maxJobs = body.maxJobs || 10;

    const results = await JobQueueService.getJobs({}, 1, maxJobs);
    const processed = [];

    for (const job of results.jobs) {
      const updated = await JobQueueService.markJobAsProcessing(job.id);
      processed.push(updated);
    }

    return jsonResponse({ processed, count: processed.length });
  } catch (error) {
    return jsonResponse({ error: 'Failed to process jobs' }, 500);
  }
};
