import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse, validateRequired, handleApiError } from '@/lib/api';
import { JobQueueService } from '@/services/jobs/job-queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await JobQueueService.getJobs(
      {
        status: (status as any) || undefined,
        type: (type as any) || undefined,
        priority: (priority as any) || undefined,
      },
      page,
      limit
    );

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env) {
      return errorResponse('Environment not available', 500);
    }

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
    return handleApiError(error);
  }
};
