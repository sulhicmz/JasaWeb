import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';
import { getPrisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const prisma = getPrisma(locals);
    const jobQueueService = new JobQueueService(prisma);

    const { id } = params;
    if (!id) {
      return errorResponse('Job ID required', 400);
    }

    const job = await jobQueueService.getJobById(id);
    if (!job) {
      return errorResponse('Job not found', 404);
    }

    return jsonResponse(job);
  } catch (_) {
    return errorResponse('Failed to fetch job', 500);
  }
};

export const PUT: APIRoute = async ({ request, locals, params }) => {
  try {
    const prisma = getPrisma(locals);
    const jobQueueService = new JobQueueService(prisma);

    const { id } = params;
    if (!id) {
      return errorResponse('Job ID required', 400);
    }

    const body = await request.json();

    const job = await jobQueueService.updateJob(id, body);
    return jsonResponse(job);
  } catch (_) {
    return errorResponse('Failed to update job', 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    const prisma = getPrisma(locals);
    const jobQueueService = new JobQueueService(prisma);

    const { id } = params;
    if (!id) {
      return errorResponse('Job ID required', 400);
    }

    await jobQueueService.deleteJob(id);
    return jsonResponse({ success: true });
  } catch (_) {
    return errorResponse('Failed to delete job', 500);
  }
};
