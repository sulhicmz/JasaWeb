/* global fetch Response */

// API endpoint for dashboard stats
export async function GET({ request }: { request: Request }) {
  try {
    // Forward the request to the backend API
    const apiBaseUrl =
      import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const backendUrl = `${apiBaseUrl}/dashboard/stats`;

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
    console.error('Dashboard stats API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch dashboard stats',
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
