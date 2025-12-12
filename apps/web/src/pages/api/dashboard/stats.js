// API endpoint for dashboard stats
import { buildUrl } from '../../../config/api.js';

export async function GET({ request, url }) {
  try {
    // Get query parameters
    const refresh = url.searchParams.get('refresh');

    // Build backend URL with configuration
    const backendUrl = buildUrl(
      '/dashboard/stats',
      refresh ? { refresh } : undefined
    );

    // Add retry logic
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Forward authorization header if present
            ...(request.headers.get('authorization') && {
              Authorization: request.headers.get('authorization'),
            }),
            // Forward organization header if present
            ...(request.headers.get('x-organization-id') && {
              'x-organization-id': request.headers.get('x-organization-id'),
            }),
            // Add request ID for tracking
            'X-Request-ID': crypto.randomUUID(),
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Backend responded with ${response.status}: ${errorText}`
          );
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control':
              refresh === 'true' ? 'no-cache' : 'public, max-age=300', // 5 minutes cache
            'X-Retry-Count': attempt.toString(),
          },
        });
      } catch (error) {
        lastError = error;
        console.warn(
          `Dashboard stats API attempt ${attempt} failed:`,
          error.message
        );

        // Don't retry on client errors (4xx)
        if (
          error.name === 'AbortError' ||
          (error.message.includes('4') && !error.message.includes('429'))
        ) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Dashboard stats API error after retries:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch dashboard stats',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}
