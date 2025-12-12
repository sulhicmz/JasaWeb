// API endpoint for projects overview
export async function GET({ request, url }) {
  try {
    // Get query parameters
    const limit = url.searchParams.get('limit') || '6';

    // Forward the request to the backend API
    const backendUrl = `http://localhost:3001/dashboard/projects-overview?limit=${limit}`;

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
  } catch (error) {
    console.error('Projects overview API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch projects overview',
        message: error.message,
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
