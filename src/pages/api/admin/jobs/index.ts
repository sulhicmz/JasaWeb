import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse, validateRequired } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { JobQueueService } from '@/services/jobs/job-queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

    const rateLimit = await checkRateLimit(request, env, 'admin-jobs-list');
    if (rateLimit) return rateLimit;

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await JobQueueService.getJobs(
      {
        status: status || undefined,
        type: type || undefined,
        priority: priority || undefined,
      },
      page,
      limit
    );

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch jobs' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

    const rateLimit = await checkRateLimit(request, env, 'admin-jobs-create');
    if (rateLimit) return rateLimit;

    const body = await request.json();
    const error = validateRequired(body, ['type', 'payload']);
    if (error) return errorResponse(error);

    const job = await JobQueueService.createJob(body.payload, {
      type: body.type,
      priority: body.priority,
      scheduledAt: body.scheduledAt,
      maxRetries: body.maxRetries,
      userId: body.userId,
      metadata: body.metadata,
    });

    return jsonResponse(job, 201);
  } catch (error) {
    return jsonResponse({ error: 'Failed to create job' }, 500);
  }
};
