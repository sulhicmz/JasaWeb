-- Migration: Add Webhook Queue
-- Version: 008
-- Created: 2026-01-07

-- Create webhook_queue table
CREATE TABLE IF NOT EXISTS "webhook_queue" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "event_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_queue_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "webhook_queue_status_idx" ON "webhook_queue"("status");
CREATE INDEX IF NOT EXISTS "webhook_queue_provider_idx" ON "webhook_queue"("provider");
CREATE INDEX IF NOT EXISTS "webhook_queue_event_id_idx" ON "webhook_queue"("event_id");
CREATE INDEX IF NOT EXISTS "webhook_queue_expires_at_idx" ON "webhook_queue"("expires_at");
CREATE INDEX IF NOT EXISTS "webhook_queue_status_created_at_idx" ON "webhook_queue"("status", "created_at");
CREATE INDEX IF NOT EXISTS "webhook_queue_provider_event_id_idx" ON "webhook_queue"("provider", "event_id");
CREATE INDEX IF NOT EXISTS "webhook_queue_status_expires_at_idx" ON "webhook_queue"("status", "expires_at");

-- Add check constraints
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_retry_count_non_negative" CHECK ("retry_count" >= 0);
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_max_retries_positive" CHECK ("max_retries" > 0);
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_retry_count_within_max" CHECK ("retry_count" <= "max_retries");
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_valid_status" CHECK ("status" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'));
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_expires_after_created" CHECK ("expires_at" > "created_at");

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_queue_updated_at_trigger
    BEFORE UPDATE ON "webhook_queue"
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_queue_updated_at();
