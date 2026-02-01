import type { APIRoute } from 'astro';
import { backgroundJobService } from '@/services/shared/BackgroundJobService';
import { jsonResponse } from '@/lib/api';

export const GET: APIRoute = async () => {
    try {
        const status = backgroundJobService.getProcessorStatus();
        const stats = await backgroundJobService.getJobStats();

        return jsonResponse({
            processor: status,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch {
        return jsonResponse({ error: 'Failed to fetch status' }, 500);
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { action, maxConcurrentJobs, pollInterval } = body;

        switch (action) {
            case 'start':
                await backgroundJobService.start();
                break;
            case 'stop':
                await backgroundJobService.stop();
                break;
            case 'configure':
                backgroundJobService.configure({
                    maxConcurrentJobs,
                    pollInterval
                });
                break;
            default:
                return jsonResponse({ error: 'Invalid action' }, 400);
        }

        const status = backgroundJobService.getProcessorStatus();
        return jsonResponse({
            message: `Action ${action} completed successfully`,
            processor: status
        });
    } catch {
        return jsonResponse({ error: 'Failed to process action' }, 500);
    }
};