/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
    HYPERDRIVE: Hyperdrive;
    CACHE: KVNamespace;
    STORAGE: R2Bucket;
    JWT_SECRET: string;
    MIDTRANS_SERVER_KEY: string;
    MIDTRANS_CLIENT_KEY: string;
}

declare namespace App {
    interface Locals extends Runtime {
        user?: {
            id: string;
            email: string;
            name: string;
            role: 'admin' | 'client';
        };
    }
}
