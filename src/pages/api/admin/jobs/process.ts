import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';
import { getPrisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const prisma = getPrisma(locals);
    const jobQueueService = new JobQueueService(prisma);

    const body = await request.json();
    const maxJobs = body.maxJobs || 10;

    const results = await jobQueueService.getJobs({}, 1, maxJobs);
    const processed = [];

    for (const job of results.jobs) {
      const updated = await jobQueueService.markJobAsProcessing(job.id);
      processed.push(updated);
    }

    return jsonResponse({ processed, count: processed.length });
  } catch (error) {
    return handleApiError(error);
  }
};
