import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { PrismaClient } from '@prisma/client';
import DataLoader from './dataLoader';
import { typeDefs } from './schema';
import { resolvers, type GraphQLContext } from './resolvers';
import { checkRateLimit } from '../rate-limit';
import { handleApiError } from '../api';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function createContext(request: Request): Promise<GraphQLContext> {
  let user = undefined;
  // Session extraction for future auth implementation
  void request.headers.get('authorization');

  return {
    prisma,
    dataLoader: new DataLoader(prisma),
    user,
  };
}

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    {
      requestDidStart: async () => ({
        didResolveOperation: async (requestContext: any) => {
          console.log(`GraphQL Operation: ${requestContext.request.operationName}`);
        },
        didEncounterErrors: async (requestContext: any) => {
          console.error('GraphQL Errors:', requestContext.errors);
        },
      }),
    },
  ],
  persistedQueries: {
    ttl: 900,
  },
  validationRules: [
  ],
});

export async function withRateLimit(request: Request): Promise<{ allowed: boolean; response?: Response }> {
  try {
    const kv = (globalThis as any).KV || process.env.KV_NAMESPACE;
    
    if (!kv) {
      return { allowed: true };
    }

    const rateLimitResponse = await checkRateLimit(
      request, 
      kv, 
      'graphql', 
      { limit: 100, window: 60 }
    );

    if (rateLimitResponse) {
      return {
        allowed: false,
        response: rateLimitResponse,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true };
  }
}

export function withCORS(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export function withSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export async function healthCheck(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          graphql: 'ready',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function handleGraphQL(request: Request): Promise<Response> {
  try {
    if (request.method === 'OPTIONS') {
      return withSecurityHeaders(withCORS(new Response(null, { status: 200 })));
    }

    if (request.method === 'GET' && new URL(request.url).searchParams.get('health') === 'true') {
      const healthResponse = await healthCheck();
      return withSecurityHeaders(withCORS(healthResponse));
    }

    const rateLimitResult = await withRateLimit(request);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return withSecurityHeaders(rateLimitResult.response);
    }

    if (request.method !== 'POST') {
      return withSecurityHeaders(withCORS(
        new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { 'Content-Type': 'application/json' },
          }
        )
      ));
    }

    const context = await createContext(request);
    const handler = startServerAndCreateNextHandler(server, {
      context: async () => context,
    });

    const response = await handler(request);

    return withSecurityHeaders(withCORS(response));

  } catch (error) {
    console.error('GraphQL handler error:', error);
    
    const errorResponse = handleApiError(error);
    return withSecurityHeaders(withCORS(errorResponse));
  }
}

export async function cleanup(): Promise<void> {
  await prisma.$disconnect();
}

export default handleGraphQL;