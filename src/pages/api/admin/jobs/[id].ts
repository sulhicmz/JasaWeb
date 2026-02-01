import type { APIRoute } from 'astro';
import { backgroundJobService } from '@/services/shared/BackgroundJobService';
import { jsonResponse, errorResponse } from '@/lib/api';

export const GET: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return errorResponse('Job ID is required', 400);
        }

        const job = await backgroundJobService.getJob(id);
        if (!job) {
            return errorResponse('Job not found', 404);
        }

        return jsonResponse(job);
    } catch {
        return errorResponse('Failed to fetch job', 500);
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return errorResponse('Job ID is required', 400);
        }

        await backgroundJobService.deleteJob(id);

        return jsonResponse({ message: 'Job deleted successfully' });
    } catch {
        return errorResponse('Failed to delete job', 500);
    }
};