import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';
import { getPrisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const prisma = getPrisma(locals);
    const jobQueueService = new JobQueueService(prisma);
    const stats = await jobQueueService.getJobStats();
    return jsonResponse(stats);
  } catch (_) {
    return errorResponse('Failed to fetch job stats', 500);
  }
};
