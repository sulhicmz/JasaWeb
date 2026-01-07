-- Rollback: Remove Webhook Queue
-- Version: 008

-- Drop trigger
DROP TRIGGER IF EXISTS webhook_queue_updated_at_trigger ON "webhook_queue";

-- Drop function
DROP FUNCTION IF EXISTS update_webhook_queue_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS "webhook_queue_status_expires_at_idx";
DROP INDEX IF EXISTS "webhook_queue_provider_event_id_idx";
DROP INDEX IF EXISTS "webhook_queue_status_created_at_idx";
DROP INDEX IF EXISTS "webhook_queue_expires_at_idx";
DROP INDEX IF EXISTS "webhook_queue_event_id_idx";
DROP INDEX IF EXISTS "webhook_queue_provider_idx";
DROP INDEX IF EXISTS "webhook_queue_status_idx";

-- Drop table
DROP TABLE IF EXISTS "webhook_queue";
