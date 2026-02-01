import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { backgroundJobService } from '@/services/shared/BackgroundJobService';
import type { JobPayload, JobHandler } from '@/services/shared/BackgroundJobService';

describe('BackgroundJobService', () => {
    beforeEach(() => {
        backgroundJobService.configure({
            maxConcurrentJobs: 5,
            pollInterval: 100
        });
    });

    afterEach(async () => {
        await backgroundJobService.stop();
    });

    describe('Job Creation', () => {
        it('should create a job with default options', async () => {
            const payload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            const job = await backgroundJobService.createJob(payload);

            expect(job).toBeDefined();
            expect(job.id).toBeDefined();
            expect(job.type).toBe('email_notification');
            expect(job.status).toBe('pending');
            expect(job.priority).toBe(0);
            expect(job.maxRetries).toBe(3);
            expect(job.timeout).toBe(300);
            expect(job.attempts).toBe(0);
        });

        it('should create a job with custom options', async () => {
            const payload: JobPayload = {
                type: 'report_generation',
                data: {
                    type: 'monthly',
                    userId: 'user123'
                }
            };

            const options = {
                priority: 5,
                delay: 60,
                maxRetries: 5,
                timeout: 600,
                tags: ['reports', 'monthly']
            };

            const job = await backgroundJobService.createJob(payload, options);

            expect(job.priority).toBe(5);
            expect(job.delay).toBe(60);
            expect(job.maxRetries).toBe(5);
            expect(job.timeout).toBe(600);
            expect(job.tags).toEqual(['reports', 'monthly']);
            expect(job.scheduledAt.getTime()).toBeGreaterThan(Date.now());
        });

        it('should validate job payload', async () => {
            const invalidPayload: JobPayload = {
                type: 'email_notification',
                data: {}
            };

            await expect(backgroundJobService.createJob(invalidPayload))
                .rejects.toThrow('Invalid job payload for type: email_notification');
        });
    });

    describe('Job Retrieval', () => {
        it('should retrieve a job by ID', async () => {
            const payload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            const createdJob = await backgroundJobService.createJob(payload);
            const retrievedJob = await backgroundJobService.getJob(createdJob.id);

            expect(retrievedJob).toBeDefined();
            expect(retrievedJob?.id).toBe(createdJob.id);
            expect(retrievedJob?.type).toBe('email_notification');
        });

        it('should return null for non-existent job', async () => {
            const job = await backgroundJobService.getJob('non-existent-id');
            expect(job).toBeNull();
        });

        it('should filter jobs by status', async () => {
            const payload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            await backgroundJobService.createJob(payload);
            await backgroundJobService.createJob(payload);

            const pendingJobs = await backgroundJobService.getJobs({ status: 'pending' });
            expect(pendingJobs).toHaveLength(2);
            expect(pendingJobs.every(job => job.status === 'pending')).toBe(true);
        });

        it('should filter jobs by type', async () => {
            const emailPayload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            await backgroundJobService.createJob(emailPayload);

            const allJobs = await backgroundJobService.getJobs({});
            expect(allJobs.length).toBeGreaterThanOrEqual(1);

            const emailJobs = await backgroundJobService.getJobs({ type: 'email_notification' });
            expect(emailJobs.length).toBeGreaterThanOrEqual(1);
            if (emailJobs.length > 0) {
                expect(emailJobs[0].type).toBe('email_notification');
            }
        });

        it('should filter jobs by tags', async () => {
            const payload: JobPayload = {
                type: 'report_generation',
                data: {
                    type: 'monthly',
                    userId: 'user123'
                }
            };

            const options = {
                tags: ['reports', 'monthly']
            };

            await backgroundJobService.createJob(payload, options);

            const taggedJobs = await backgroundJobService.getJobs({ 
                tags: ['reports'] 
            });
            expect(taggedJobs.length).toBeGreaterThanOrEqual(1);
            expect(taggedJobs.some(job => job.tags?.includes('reports'))).toBe(true);
        });
    });

    describe('Job Statistics', () => {
        it('should return correct job statistics', async () => {
            const payload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            await backgroundJobService.createJob(payload);
            await backgroundJobService.createJob(payload);

            const stats = await backgroundJobService.getJobStats();

            expect(stats.total).toBe(2);
            expect(stats.pending).toBe(2);
            expect(stats.processing).toBe(0);
            expect(stats.completed).toBe(0);
            expect(stats.failed).toBe(0);
            expect(stats.cancelled).toBe(0);
        });
    });

    describe('Job Management', () => {
        it('should retry a failed job', async () => {
            const payload: JobPayload = {
                type: 'data_processing',
                data: {
                    operation: 'test'
                }
            };

            const job = await backgroundJobService.createJob(payload);
            
            await backgroundJobService.updateJob({
                id: job.id,
                status: 'failed',
                attempts: 3,
                error: {
                    message: 'Test failure',
                    code: 'TEST_ERROR'
                }
            });

            const retriedJob = await backgroundJobService.retryJob(job.id);
            
            expect(retriedJob.status).toBe('pending');
            expect(retriedJob.attempts).toBe(0);
            expect(retriedJob.error).toBeUndefined();
        });

        it('should cancel a job', async () => {
            const payload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            const job = await backgroundJobService.createJob(payload);
            
            const cancelledJob = await backgroundJobService.cancelJob(job.id);
            
            expect(cancelledJob.status).toBe('cancelled');
            expect(cancelledJob.completedAt).toBeDefined();
        });

        it('should delete a job', async () => {
            const payload: JobPayload = {
                type: 'email_notification',
                data: {
                    to: 'test@example.com',
                    subject: 'Test',
                    body: 'Test body'
                }
            };

            const job = await backgroundJobService.createJob(payload);
            
            await backgroundJobService.deleteJob(job.id);
            
            const deletedJob = await backgroundJobService.getJob(job.id);
            expect(deletedJob).toBeNull();
        });

        it('should update job progress', async () => {
            const payload: JobPayload = {
                type: 'data_processing',
                data: {
                    operation: 'test'
                }
            };

            const job = await backgroundJobService.createJob(payload);
            
            await backgroundJobService.updateJob({
                id: job.id,
                status: 'processing'
            });

            await backgroundJobService.updateJobProgress(job.id, 50);
            
            const updatedJob = await backgroundJobService.getJob(job.id);
            expect(updatedJob?.progress).toBe(50);
        });
    });

    describe('Custom Job Handlers', () => {
        it('should register and use custom job handler', async () => {
            const customHandler: JobHandler = {
                async execute(payload: JobPayload) {
                    return { custom: true, data: payload.data };
                },
                async validate(payload: JobPayload) {
                    return payload.data.custom === true;
                }
            };

            backgroundJobService.registerHandler('custom_job', customHandler);

            const validPayload: JobPayload = {
                type: 'custom_job',
                data: {
                    custom: true,
                    value: 'test'
                }
            };

            const job = await backgroundJobService.createJob(validPayload);
            expect(job.type).toBe('custom_job');

            const invalidPayload: JobPayload = {
                type: 'custom_job',
                data: {
                    custom: false
                }
            };

            await expect(backgroundJobService.createJob(invalidPayload))
                .rejects.toThrow('Invalid job payload for type: custom_job');
        });
    });

    describe('Processor Status', () => {
        it('should return processor status', () => {
            const status = backgroundJobService.getProcessorStatus();

            expect(status.isRunning).toBe(false);
            expect(status.processingJobs).toBe(0);
            expect(status.maxConcurrentJobs).toBe(5);
            expect(status.registeredHandlers).toContain('email_notification');
            expect(status.registeredHandlers).toContain('report_generation');
            expect(status.registeredHandlers).toContain('data_processing');
        });

        it('should configure processor settings', () => {
            backgroundJobService.configure({
                maxConcurrentJobs: 10,
                pollInterval: 500
            });

            const status = backgroundJobService.getProcessorStatus();
            expect(status.maxConcurrentJobs).toBe(10);
        });
    });

    describe('Processor Lifecycle', () => {
        it('should start and stop processor', async () => {
            await backgroundJobService.start();
            
            let status = backgroundJobService.getProcessorStatus();
            expect(status.isRunning).toBe(true);

            await backgroundJobService.stop();
            
            status = backgroundJobService.getProcessorStatus();
            expect(status.isRunning).toBe(false);
        });

        it('should not start processor if already running', async () => {
            await backgroundJobService.start();
            await backgroundJobService.start();
            
            const status = backgroundJobService.getProcessorStatus();
            expect(status.isRunning).toBe(true);
        });
    });
});