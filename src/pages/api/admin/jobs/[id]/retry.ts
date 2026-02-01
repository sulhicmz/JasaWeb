import type { APIRoute } from 'astro';
import { backgroundJobService } from '@/services/shared/BackgroundJobService';
import { jsonResponse, errorResponse } from '@/lib/api';

export const POST: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return errorResponse('Job ID is required', 400);
        }

        const job = await backgroundJobService.retryJob(id);
        return jsonResponse(job);
    } catch (e) {
        if (e instanceof Error) {
            return errorResponse(e.message, 400);
        }
        return errorResponse('Failed to retry job', 500);
    }
};