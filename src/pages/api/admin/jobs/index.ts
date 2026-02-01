import type { APIRoute } from 'astro';
import { backgroundJobService } from '@/services/shared/BackgroundJobService';
import { jsonResponse, errorResponse, validateRequired } from '@/lib/api';
import type { JobPayload, JobOptions } from '@/services/shared/BackgroundJobService';

export const GET: APIRoute = async ({ url }) => {
    try {
        const status = url.searchParams.get('status') as any;
        const type = url.searchParams.get('type');
        const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined;
        const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined;

        const filter = {
            status,
            type: type || undefined,
            tags,
            limit,
            offset,
            startDate,
            endDate
        };

        const jobs = await backgroundJobService.getJobs(filter);
        const stats = await backgroundJobService.getJobStats();

        return jsonResponse({
            jobs,
            stats,
            pagination: {
                limit,
                offset,
                total: stats.total
            }
        });
    } catch {
        return errorResponse('Failed to fetch jobs', 500);
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const error = validateRequired(body, ['type', 'data']);
        if (error) {
            return errorResponse(error);
        }

        const { type, data, metadata, ...options }: JobPayload & JobOptions = body;

        const job = await backgroundJobService.createJob(
            { type, data, metadata },
            options
        );

        return jsonResponse(job, 201);
    } catch {
        return errorResponse('Failed to create job', 500);
    }
};