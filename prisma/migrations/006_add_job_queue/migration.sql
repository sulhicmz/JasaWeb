-- Migration: Add Job Queue for Background Jobs
-- Created: 2025-01-07
-- Purpose: Support background job processing for notifications, reports, and async operations

-- CreateEnum: JobType
CREATE TYPE "JobType" AS ENUM ('NOTIFICATION', 'REPORT_GENERATION', 'EMAIL_SEND', 'WEBHOOK', 'CLEANUP', 'BACKUP', 'DATA_EXPORT', 'DATA_IMPORT');

-- CreateEnum: JobStatus
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum: JobPriority
CREATE TYPE "JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable: job_queue
CREATE TABLE "job_queue" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "JobPriority" NOT NULL DEFAULT 'MEDIUM',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: job_queue_status_idx
CREATE INDEX "job_queue_status_idx" ON "job_queue"("status");

-- CreateIndex: job_queue_scheduled_at_idx
CREATE INDEX "job_queue_scheduled_at_idx" ON "job_queue"("scheduled_at");

-- CreateIndex: job_queue_type_idx
CREATE INDEX "job_queue_type_idx" ON "job_queue"("type");

-- CreateIndex: job_queue_priority_idx
CREATE INDEX "job_queue_priority_idx" ON "job_queue"("priority");

-- CreateIndex: job_queue_status_scheduled_at_idx
CREATE INDEX "job_queue_status_scheduled_at_idx" ON "job_queue"("status", "scheduled_at");

-- CreateIndex: job_queue_status_priority_scheduled_at_idx
CREATE INDEX "job_queue_status_priority_scheduled_at_idx" ON "job_queue"("status", "priority", "scheduled_at");

-- CreateIndex: job_queue_user_id_idx
CREATE INDEX "job_queue_user_id_idx" ON "job_queue"("user_id");

-- CreateIndex: job_queue_created_at_idx
CREATE INDEX "job_queue_created_at_idx" ON "job_queue"("created_at");

-- CreateIndex: job_queue_type_status_idx
CREATE INDEX "job_queue_type_status_idx" ON "job_queue"("type", "status");

-- CreateIndex: job_queue_user_id_created_at_idx
CREATE INDEX "job_queue_user_id_created_at_idx" ON "job_queue"("user_id", "created_at");

-- CreateIndex: job_queue_status_priority_created_at_idx
CREATE INDEX "job_queue_status_priority_created_at_idx" ON "job_queue"("status", "priority", "created_at");

-- Add comment for documentation
COMMENT ON TABLE "job_queue" IS 'Background job queue for async operations including notifications, reports, and maintenance tasks';
COMMENT ON COLUMN "job_queue"."type" IS 'Type of job (NOTIFICATION, REPORT_GENERATION, EMAIL_SEND, etc.)';
COMMENT ON COLUMN "job_queue"."status" IS 'Current job status (PENDING, PROCESSING, COMPLETED, FAILED, etc.)';
COMMENT ON COLUMN "job_queue"."priority" IS 'Job execution priority (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN "job_queue"."payload" IS 'Job-specific data and parameters';
COMMENT ON COLUMN "job_queue"."result" IS 'Optional result data after completion';
COMMENT ON COLUMN "job_queue"."error" IS 'Error message if job failed';
COMMENT ON COLUMN "job_queue"."scheduled_at" IS 'When the job is scheduled to run';
COMMENT ON COLUMN "job_queue"."started_at" IS 'When job processing started';
COMMENT ON COLUMN "job_queue"."completed_at" IS 'When job processing completed';
COMMENT ON COLUMN "job_queue"."retry_count" IS 'Current retry attempt count';
COMMENT ON COLUMN "job_queue"."max_retries" IS 'Maximum retry attempts before marking as failed';
COMMENT ON COLUMN "job_queue"."last_error" IS 'Last error message for retry tracking';
COMMENT ON COLUMN "job_queue"."user_id" IS 'User who triggered the job (optional)';
COMMENT ON COLUMN "job_queue"."metadata" IS 'Additional metadata for the job';
