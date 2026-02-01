/**
 * Background Job Queue Service
 * Provides priority-based job queue management with Redis persistence
 */

import redisCache from '@/lib/redis-cache';
import { randomUUID } from 'crypto';
import { BACKGROUND_JOB_CONFIG } from '../../config/background-jobs';

export interface JobOptions {
    priority?: number;
    delay?: number;
    maxRetries?: number;
    timeout?: number;
    tags?: string[];
}

export interface JobPayload {
    type: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface Job extends JobPayload, JobOptions {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    attempts: number;
    createdAt: Date;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    result?: any;
    progress?: number;
}

export interface JobStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
}

export interface JobFilter {
    status?: Job['status'];
    type?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
}

export interface JobHandler {
    execute(payload: JobPayload, job: Job): Promise<any>;
    validate?(payload: JobPayload): Promise<boolean>;
    getEstimatedTime?(payload: JobPayload): number;
}

class BackgroundJobService {
    private handlers: Map<string, JobHandler> = new Map();
    private processingJobs: Set<string> = new Set();
    private maxConcurrentJobs: number;
    private pollInterval: number;
    private isRunning: boolean = false;
    private pollTimer?: NodeJS.Timeout;

    constructor() {
        this.maxConcurrentJobs = BACKGROUND_JOB_CONFIG.service.maxConcurrentJobs;
        this.pollInterval = BACKGROUND_JOB_CONFIG.service.pollInterval;
        this.initializeDefaultHandlers();
    }

    private initializeDefaultHandlers(): void {
        this.registerHandler('email_notification', {
            async execute(payload: JobPayload): Promise<any> {
                const { to, subject } = payload.data;
                
                console.log(`Sending email to ${to}: ${subject}`);
                
                await new Promise(resolve => setTimeout(resolve, BACKGROUND_JOB_CONFIG.timeouts.email));
                
                return {
                    sent: true,
                    to,
                    subject,
                    timestamp: new Date().toISOString()
                };
            },
            
            async validate(payload: JobPayload): Promise<boolean> {
                const { to, subject, body } = payload.data;
                return !!(to && subject && body);
            },
            
            getEstimatedTime(): number {
                return BACKGROUND_JOB_CONFIG.estimatedTimes.email;
            }
        });

        this.registerHandler('report_generation', {
            async execute(payload: JobPayload): Promise<any> {
                const { type, userId } = payload.data;
                
                console.log(`Generating ${type} report for user ${userId}`);
                
                await new Promise(resolve => setTimeout(resolve, BACKGROUND_JOB_CONFIG.timeouts.report));
                
                return {
                    reportId: randomUUID(),
                    type,
                    userId,
                    generatedAt: new Date().toISOString(),
                    downloadUrl: `/api/reports/${randomUUID()}/download`
                };
            },
            
            async validate(payload: JobPayload): Promise<boolean> {
                const { type, userId } = payload.data;
                return !!(type && userId);
            },
            
            getEstimatedTime(): number {
                return BACKGROUND_JOB_CONFIG.estimatedTimes.report;
            }
        });

        this.registerHandler('data_processing', {
            async execute(payload: JobPayload): Promise<any> {
                const { operation, data } = payload.data;
                
                console.log(`Processing data operation: ${operation}`);
                
                await new Promise(resolve => setTimeout(resolve, BACKGROUND_JOB_CONFIG.timeouts.dataProcessing));
                
                return {
                    operation,
                    processed: data.length || 0,
                    timestamp: new Date().toISOString()
                };
            },
            
            async validate(payload: JobPayload): Promise<boolean> {
                const { operation } = payload.data;
                return !!operation;
            },
            
            getEstimatedTime(): number {
                return BACKGROUND_JOB_CONFIG.estimatedTimes.report;
            }
        });
    }

    registerHandler(type: string, handler: JobHandler): void {
        this.handlers.set(type, handler);
    }

    async createJob(payload: JobPayload, options: JobOptions = {}): Promise<Job> {
        const delay = options.delay ?? 0;
        const job: Job = {
            id: randomUUID(),
            ...payload,
            priority: options.priority ?? BACKGROUND_JOB_CONFIG.defaults.priority,
            delay: options.delay ?? BACKGROUND_JOB_CONFIG.defaults.delay,
            maxRetries: options.maxRetries ?? BACKGROUND_JOB_CONFIG.defaults.maxRetries,
            timeout: options.timeout ?? BACKGROUND_JOB_CONFIG.defaults.timeout,
            tags: options.tags ?? [],
            status: 'pending',
            attempts: 0,
            createdAt: new Date(),
            scheduledAt: new Date(Date.now() + delay * 1000)
        };

        const handler = this.handlers.get(payload.type);
        if (handler?.validate) {
            const isValid = await handler.validate(payload);
            if (!isValid) {
                throw new Error(`Invalid job payload for type: ${payload.type}`);
            }
        }

        await this.storeJob(job);

        return job;
    }

    private async storeJob(job: Job): Promise<void> {
        const key = `job:${job.id}`;
        await redisCache.set(key, job, { ttl: 86400 });
        
        const queueKey = this.getQueueKey(job.status, job.priority ?? 0);
        await redisCache.set(queueKey, job.id, { ttl: 86400 });
    }

    private getQueueKey(status: Job['status'], priority: number): string {
        return `jobs:queue:${status}:${priority}`;
    }

    async getJob(id: string): Promise<Job | null> {
        const key = `job:${id}`;
        return await redisCache.get<Job>(key);
    }

    async updateJob(job: Partial<Job> & { id: string }): Promise<void> {
        const existingJob = await this.getJob(job.id);
        if (!existingJob) {
            throw new Error(`Job not found: ${job.id}`);
        }

        const updatedJob = { ...existingJob, ...job };
        
        const oldQueueKey = this.getQueueKey(existingJob.status, existingJob.priority ?? 0);
        await redisCache.delete(oldQueueKey);
        
        const newQueueKey = this.getQueueKey(updatedJob.status, updatedJob.priority ?? 0);
        await redisCache.set(newQueueKey, updatedJob.id, { ttl: 86400 });
        
        const jobKey = `job:${updatedJob.id}`;
        await redisCache.set(jobKey, updatedJob, { ttl: 86400 });
    }

    async getJobs(filter: JobFilter = {}): Promise<Job[]> {
        const {
            status,
            type,
            tags,
            limit = 50,
            offset = 0,
            startDate,
            endDate
        } = filter;

        const jobs: Job[] = [];
        
        if (status) {
            for (let priority = 10; priority >= 0; priority--) {
                const queueKey = this.getQueueKey(status, priority);
                const jobId = await redisCache.get<string>(queueKey);
                if (jobId) {
                    const job = await this.getJob(jobId);
                    if (job) jobs.push(job);
                }
            }
        } else {
            for (const jobStatus of ['pending', 'processing', 'completed', 'failed', 'cancelled']) {
                for (let priority = 10; priority >= 0; priority--) {
                    const queueKey = this.getQueueKey(jobStatus as Job['status'], priority);
                    const jobId = await redisCache.get<string>(queueKey);
                    if (jobId) {
                        const job = await this.getJob(jobId);
                        if (job) jobs.push(job);
                    }
                }
            }
        }

        let filteredJobs = jobs;
        
        if (type) {
            filteredJobs = filteredJobs.filter(job => job.type === type);
        }
        
        if (tags && tags.length > 0) {
            filteredJobs = filteredJobs.filter(job => 
                tags.some(tag => (job.tags || []).includes(tag))
            );
        }
        
        if (startDate) {
            filteredJobs = filteredJobs.filter(job => 
                new Date(job.createdAt) >= startDate
            );
        }
        
        if (endDate) {
            filteredJobs = filteredJobs.filter(job => 
                new Date(job.createdAt) <= endDate
            );
        }

        return filteredJobs
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(offset, offset + limit);
    }

    async getJobStats(): Promise<JobStats> {
        const stats: JobStats = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            cancelled: 0
        };

        for (const status of ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const) {
            for (let priority = 10; priority >= 0; priority--) {
                const queueKey = this.getQueueKey(status, priority);
                const jobId = await redisCache.get<string>(queueKey);
                if (jobId) {
                    stats[status]++;
                    stats.total++;
                }
            }
        }

        return stats;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        console.log('Background job processor started');

        this.pollTimer = setInterval(async () => {
            await this.processPendingJobs();
        }, this.pollInterval);
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }

        console.log('Background job processor stopped');
    }

    private async processPendingJobs(): Promise<void> {
        if (this.processingJobs.size >= this.maxConcurrentJobs) {
            return;
        }

        const pendingJobs: Job[] = [];
        
        for (let priority = 10; priority >= 0; priority--) {
            if (pendingJobs.length >= this.maxConcurrentJobs - this.processingJobs.size) {
                break;
            }

            const queueKey = this.getQueueKey('pending', priority);
            const jobId = await redisCache.get<string>(queueKey);
            
            if (jobId) {
                const job = await this.getJob(jobId);
                if (job && new Date(job.scheduledAt) <= new Date()) {
                    pendingJobs.push(job);
                }
            }
        }

        for (const job of pendingJobs) {
            this.processJob(job);
        }
    }

    private async processJob(job: Job): Promise<void> {
        if (this.processingJobs.has(job.id)) {
            return;
        }

        this.processingJobs.add(job.id);

        try {
            await this.updateJob({
                id: job.id,
                status: 'processing',
                startedAt: new Date(),
                attempts: job.attempts + 1
            });

            const handler = this.handlers.get(job.type);
            if (!handler) {
                throw new Error(`No handler found for job type: ${job.type}`);
            }

            const timeout = job.timeout || 300;
            const payload: JobPayload = {
                type: job.type,
                data: job.data,
                metadata: job.metadata
            };
            const result = await this.executeWithTimeout(
                handler.execute(payload, job),
                timeout * 1000
            );

            await this.updateJob({
                id: job.id,
                status: 'completed',
                completedAt: new Date(),
                result,
                progress: 100
            });

            console.log(`Job ${job.id} completed successfully`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            const maxRetries = job.maxRetries || BACKGROUND_JOB_CONFIG.defaults.maxRetries;
            if (job.attempts < maxRetries) {
                const retryDelay = Math.pow(2, job.attempts) * 1000;
                
                await this.updateJob({
                    id: job.id,
                    status: 'pending',
                    scheduledAt: new Date(Date.now() + retryDelay),
                    error: {
                        message: errorMessage,
                        stack: error instanceof Error ? error.stack : undefined
                    }
                });

                console.log(`Job ${job.id} failed, scheduling retry ${job.attempts + 1}/${maxRetries}`);

            } else {
                await this.updateJob({
                    id: job.id,
                    status: 'failed',
                    completedAt: new Date(),
                    error: {
                        message: errorMessage,
                        stack: error instanceof Error ? error.stack : undefined,
                        code: 'MAX_RETRIES_EXCEEDED'
                    }
                });

                console.error(`Job ${job.id} failed permanently:`, errorMessage);
            }
        } finally {
            this.processingJobs.delete(job.id);
        }
    }

    private async executeWithTimeout<T>(fn: Promise<T>, timeoutMs: number): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Job timeout')), timeoutMs);
        });

        return Promise.race([fn, timeoutPromise]);
    }

    async retryJob(id: string): Promise<Job> {
        const job = await this.getJob(id);
        if (!job) {
            throw new Error(`Job not found: ${id}`);
        }

        if (job.status !== 'failed') {
            throw new Error(`Cannot retry job with status: ${job.status}`);
        }

        await this.updateJob({
            id: job.id,
            status: 'pending',
            scheduledAt: new Date(),
            attempts: 0,
            error: undefined
        });

        return (await this.getJob(id))!;
    }

    async cancelJob(id: string): Promise<Job> {
        const job = await this.getJob(id);
        if (!job) {
            throw new Error(`Job not found: ${id}`);
        }

        if (job.status === 'completed' || job.status === 'cancelled') {
            throw new Error(`Cannot cancel job with status: ${job.status}`);
        }

        await this.updateJob({
            id: job.id,
            status: 'cancelled',
            completedAt: new Date()
        });

        return (await this.getJob(id))!;
    }

    async deleteJob(id: string): Promise<void> {
        const job = await this.getJob(id);
        if (!job) {
            return;
        }

        const queueKey = this.getQueueKey(job.status, job.priority ?? 0);
        await redisCache.delete(queueKey);
        
        const jobKey = `job:${id}`;
        await redisCache.delete(jobKey);
    }

    async updateJobProgress(id: string, progress: number): Promise<void> {
        const job = await this.getJob(id);
        if (!job || job.status !== 'processing') {
            return;
        }

        await this.updateJob({
            id: job.id,
            progress: Math.max(0, Math.min(100, progress))
        });
    }

    getProcessorStatus(): {
        isRunning: boolean;
        processingJobs: number;
        maxConcurrentJobs: number;
        registeredHandlers: string[];
    } {
        return {
            isRunning: this.isRunning,
            processingJobs: this.processingJobs.size,
            maxConcurrentJobs: this.maxConcurrentJobs,
            registeredHandlers: Array.from(this.handlers.keys())
        };
    }

    configure(options: {
        maxConcurrentJobs?: number;
        pollInterval?: number;
    }): void {
        if (options.maxConcurrentJobs !== undefined) {
            this.maxConcurrentJobs = options.maxConcurrentJobs;
        }
        
        if (options.pollInterval !== undefined) {
            this.pollInterval = options.pollInterval;
            
            if (this.isRunning) {
                this.stop();
                setTimeout(() => this.start(), BACKGROUND_JOB_CONFIG.timeouts.restart);
            }
        }
    }
}

export const backgroundJobService = new BackgroundJobService();