/**
 * OpenAPI Documentation API Endpoint
 * Serves comprehensive API documentation in JSON format
 */
import type { APIRoute } from 'astro';
import { jsonResponse, handleApiError } from '@/lib/api';
import { openApiSpec } from '@/lib/openapi-generator';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'json';

        if (format === 'yaml') {
            // If YAML format is requested, we can add yaml package later
            return jsonResponse({
                message: 'YAML format not yet supported',
                downloadUrl: '/api/docs?format=json'
            });
        }

        // Return OpenAPI specification in JSON format
        return new Response(JSON.stringify(openApiSpec, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600', // 1 hour cache
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
};