import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

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
    return handleApiError(error);
  }
};
