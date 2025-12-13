/* global fetch Response */

// API endpoint for recent activity
export async function GET({ request, url }: { request: Request; url: URL }) {
  try {
    // Get query parameters
    const limit = url.searchParams.get('limit') || '10';

    // Forward the request to the backend API
    const backendUrl = `http://localhost:3001/dashboard/recent-activity?limit=${limit}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
        // Forward organization header if present
        ...(request.headers.get('x-organization-id') && {
          'x-organization-id': request.headers.get('x-organization-id')!,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Recent activity API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch recent activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
