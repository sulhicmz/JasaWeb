import { type APIRoute } from 'astro';
import { jsonResponse, handleApiError } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';
import { getPrisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const prisma = getPrisma(locals);
    const jobQueueService = new JobQueueService(prisma);
    const stats = await jobQueueService.getJobStats();
    return jsonResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
};
