import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Create Prisma client instance for Cloudflare Workers
 * Uses Hyperdrive for connection pooling
 */
export function createPrismaClient(env: Env): PrismaClient {
    const pool = new Pool({
        connectionString: env.HYPERDRIVE.connectionString,
    });

    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter });
}

/**
 * Helper to get Prisma client from Astro context
 */
export function getPrisma(locals: App.Locals): PrismaClient {
    return createPrismaClient(locals.runtime.env);
}

/**
 * Prevent Prisma client bundling in browser environments
 * This ensures server-side code is never included in client bundles
 */
export const prisma = typeof window === 'undefined' 
  ? null 
  : undefined;
