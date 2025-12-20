/**
 * Cloudflare R2 Storage Service
 * Provides file upload/download utilities
 */

type R2Bucket = any;
type R2ObjectBody = any;
type R2Objects = any;

export interface UploadOptions {
    contentType?: string;
    customMetadata?: Record<string, string>;
}

export interface UploadResult {
    key: string;
    url: string;
}

/**
 * Upload file to R2
 */
export async function uploadFile(
    r2: R2Bucket,
    key: string,
    data: ArrayBuffer | ReadableStream | string,
    options?: UploadOptions
): Promise<UploadResult> {
    await r2.put(key, data, {
        httpMetadata: {
            contentType: options?.contentType ?? 'application/octet-stream',
        },
        customMetadata: options?.customMetadata,
    });

    return {
        key,
        url: `/storage/${key}`,
    };
}

/**
 * Download file from R2
 */
export async function downloadFile(
    r2: R2Bucket,
    key: string
): Promise<R2ObjectBody | null> {
    return await r2.get(key);
}

/**
 * Delete file from R2
 */
export async function deleteFile(
    r2: R2Bucket,
    key: string
): Promise<void> {
    await r2.delete(key);
}

/**
 * List files in R2 bucket
 */
export async function listFiles(
    r2: R2Bucket,
    prefix?: string,
    limit?: number
): Promise<R2Objects> {
    return await r2.list({
        prefix,
        limit: limit ?? 100,
    });
}

/**
 * Generate unique file key
 */
export function generateFileKey(
    folder: string,
    filename: string
): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = filename.split('.').pop() ?? '';
    return `${folder}/${timestamp}-${random}.${ext}`;
}

/**
 * Get content type from filename
 */
export function getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return types[ext] ?? 'application/octet-stream';
}
