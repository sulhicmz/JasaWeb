-- Create webhook_queue table
CREATE TABLE IF NOT EXISTS "webhook_queue" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_attempt" TIMESTAMP(3),
    "next_attempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_queue_pkey" PRIMARY KEY ("id")
);

-- Add comment for enum constraint
COMMENT ON COLUMN "webhook_queue"."status" IS 'pending, processing, failed, completed';

-- Create indexes for webhook_queue
CREATE INDEX IF NOT EXISTS "webhook_queue_status_idx" ON "webhook_queue"("status");
CREATE INDEX IF NOT EXISTS "webhook_queue_next_attempt_idx" ON "webhook_queue"("next_attempt");
CREATE INDEX IF NOT EXISTS "webhook_queue_order_id_idx" ON "webhook_queue"("order_id");

-- Add check constraint for status values
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_status_check" 
    CHECK ("status" IN ('pending', 'processing', 'failed', 'completed'));
