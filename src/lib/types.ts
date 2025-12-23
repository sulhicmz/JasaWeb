/**
 * Shared Type Definitions
 */

// Re-export config types
export type { ServiceId, ServiceConfig, ServiceFeature } from './config';

// ==============================================
// API TYPES
// ==============================================
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ==============================================
// USER TYPES
// ==============================================
export type UserRole = 'admin' | 'client';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    createdAt: Date;
}

export interface UserSession {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

// ==============================================
// PROJECT TYPES
// ==============================================
export type ProjectType = 'sekolah' | 'berita' | 'company';
export type ProjectStatus = 'pending_payment' | 'in_progress' | 'review' | 'completed';

export interface ProjectCredentials {
    admin_url?: string;
    username?: string;
    password?: string;
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    type: ProjectType;
    status: ProjectStatus;
    url?: string;
    credentials?: ProjectCredentials;
    createdAt: Date;
    updatedAt: Date;
}

// ==============================================
// INVOICE TYPES
// ==============================================
export type InvoiceStatus = 'unpaid' | 'paid';

export interface Invoice {
    id: string;
    projectId: string;
    amount: number;
    status: InvoiceStatus;
    midtransOrderId?: string;
    qrisUrl?: string;
    paidAt?: Date;
    createdAt: Date;
}

// ==============================================
// FORM TYPES
// ==============================================
export interface LoginForm {
    email: string;
    password: string;
    [key: string]: unknown;
}

export interface RegisterForm {
    name: string;
    email: string;
    phone?: string;
    password: string;
    [key: string]: unknown;
}

// ==============================================
// PAYMENT TYPES
// ==============================================
export interface PaymentResponse {
    success: boolean;
    orderId: string;
    qrisUrl: string;
    grossAmount: number;
    paymentType: string;
    statusCode: string;
    transactionId?: string;
    message: string;
}

export interface CreateInvoiceRequest {
    projectId: string;
    amount: number;
}

export interface MidtransChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    actions?: Array<{
        name: string;
        method: string;
        url: string;
    }>;
}

// ==============================================
// VALIDATION TYPES
// ==============================================
export interface ValidationData {
    [key: string]: unknown;
}

export interface ValidationRule {
    required?: string[];
    email?: string;
    password?: string;
    minLength?: Record<string, number>;
    pattern?: Record<string, RegExp>;
}

export interface UserValidationData {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    role?: UserRole;
    [key: string]: unknown;
}

export interface ProjectValidationData {
    name?: string;
    type?: ProjectType;
    status?: ProjectStatus;
    url?: string;
    credentials?: ProjectCredentials;
    [key: string]: unknown;
}

export interface UserValidationErrors {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    role?: string;
}

export interface ProjectValidationErrors {
    name?: string;
    type?: string;
    status?: string;
    url?: string;
    credentials?: string;
}

// ==============================================
// COMPONENT PROPS
// ==============================================
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface NavLinkProps {
    href: string;
    label: string;
    isActive?: boolean;
}

// ==============================================
// CLOUDFLARE WORKERS TYPES
// ==============================================
export interface CloudflareRuntime {
    // Environment variables (accessible via runtime.env)
    env: {
        // Database
        DATABASE_URL?: string;
        HYPERDRIVE?: { connectionString: string };

        // Authentication
        JWT_SECRET?: string;

        // Payment
        MIDTRANS_SERVER_KEY?: string;
        MIDTRANS_CLIENT_KEY?: string;
        MIDTRANS_IS_PRODUCTION?: string;

        // Services
        SESSION?: KVNamespace;
        CACHE?: KVNamespace;
        STORAGE?: R2Bucket;

        // Other app variables
        NODE_ENV?: 'development' | 'production';
    };
}

// Interface for runtime environment (as passed to functions)
export interface RuntimeEnv {
    DATABASE_URL?: string;
    HYPERDRIVE?: string;
    JWT_SECRET?: string;
    MIDTRANS_SERVER_KEY?: string;
    MIDTRANS_CLIENT_KEY?: string;
    MIDTRANS_IS_PRODUCTION?: string;
    NODE_ENV?: 'development' | 'production';
}

// KV Namespace types
export interface KVNamespace {
    get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | object | ArrayBuffer | ReadableStream | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: {
        expiration?: number;
        expirationTtl?: number;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        keys: Array<{
            name: string;
            expiration?: number;
            metadata?: Record<string, unknown>;
        }>;
        list_complete: boolean;
        cursor?: string;
    }>;
}

// R2 Bucket types
export interface R2Bucket {
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ArrayBuffer | ReadableStream | string, options?: {
        httpMetadata?: {
            contentType?: string;
            cacheControl?: string;
            contentEncoding?: string;
            contentLanguage?: string;
        };
        customMetadata?: Record<string, string>;
    }): Promise<R2Object>;
    delete(key: string): Promise<void>;
    delete(keys: string[]): Promise<R2Objects>;
    head(key: string): Promise<R2Object | null>;
    list(options?: {
        prefix?: string;
        delimiter?: string;
        include?: Array<'httpMetadata' | 'customMetadata'>;
        limit?: number;
        cursor?: string;
    }): Promise<R2Objects>;
    createMultipartUpload(key: string): Promise<R2MultipartUpload>;
}

export interface R2Object {
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
    httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
        contentEncoding?: string;
        contentLanguage?: string;
    };
    customMetadata?: Record<string, string>;
}

export interface R2ObjectBody extends R2Object {
    body: ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T = object>(): Promise<T>;
}

export interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
}

export interface R2MultipartUpload {
    key: string;
    uploadId: string;
    partNumber: number;
    abort(): Promise<void>;
    completePart(partNumber: number, etag: string): Promise<void>;
    uploadPart(partNumber: number, value: ArrayBuffer | ReadableStream | string): Promise<{
        partNumber: number;
        etag: string;
    }>;
}

// D1 Database types (if needed in future)
export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(column?: string): Promise<T | undefined>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: {
        duration: number;
        changes?: number;
        last_row_id?: number;
        served_by: string;
    };
}
