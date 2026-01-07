-- Migration Rollback: Remove Job Queue
-- Purpose: Safely revert job queue table and enums

-- DropIndexes
DROP INDEX IF EXISTS "job_queue_status_priority_created_at_idx";
DROP INDEX IF EXISTS "job_queue_user_id_created_at_idx";
DROP INDEX IF EXISTS "job_queue_type_status_idx";
DROP INDEX IF EXISTS "job_queue_created_at_idx";
DROP INDEX IF EXISTS "job_queue_user_id_idx";
DROP INDEX IF EXISTS "job_queue_status_priority_scheduled_at_idx";
DROP INDEX IF EXISTS "job_queue_status_scheduled_at_idx";
DROP INDEX IF EXISTS "job_queue_priority_idx";
DROP INDEX IF EXISTS "job_queue_type_idx";
DROP INDEX IF EXISTS "job_queue_scheduled_at_idx";
DROP INDEX IF EXISTS "job_queue_status_idx";

-- DropTable
DROP TABLE IF EXISTS "job_queue";

-- DropEnum (must drop in reverse order of dependencies)
DROP TYPE IF EXISTS "JobPriority";
DROP TYPE IF EXISTS "JobStatus";
DROP TYPE IF EXISTS "JobType";
