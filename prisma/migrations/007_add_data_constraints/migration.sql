-- Migration: Add Data Integrity Constraints
-- Created: 2025-01-07
-- Purpose: Enhance data integrity with CHECK constraints for critical business rules

-- Add constraint: Invoice amounts must be positive
ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_amount_positive" CHECK (amount > 0);

-- Add constraint: Paid invoice must have paidAt date
ALTER TABLE "invoices"
ADD CONSTRAINT "paid_invoice_has_paid_at" CHECK (
  (status = 'paid') = (paid_at IS NOT NULL)
);

-- Add constraint: Paid invoice's paidAt must be after createdAt
ALTER TABLE "invoices"
ADD CONSTRAINT "paid_at_after_created_at" CHECK (
  paid_at IS NULL OR paid_at >= created_at
);

-- Add constraint: Retry count must be non-negative
ALTER TABLE "job_queue"
ADD CONSTRAINT "retry_count_non_negative" CHECK (retry_count >= 0);

-- Add constraint: Max retries must be positive
ALTER TABLE "job_queue"
ADD CONSTRAINT "max_retries_positive" CHECK (max_retries > 0);

-- Add constraint: Retry count cannot exceed max retries
ALTER TABLE "job_queue"
ADD CONSTRAINT "retry_count_within_max" CHECK (retry_count <= max_retries);

-- Add constraint: Pricing plan prices must be positive
ALTER TABLE "pricing_plans"
ADD CONSTRAINT "pricing_plan_price_positive" CHECK (price > 0);

-- Add constraint: Email format validation
ALTER TABLE "users"
ADD CONSTRAINT "user_email_format" CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint: Pricing plan sort order must be non-negative
ALTER TABLE "pricing_plans"
ADD CONSTRAINT "pricing_plan_sort_order_non_negative" CHECK (sort_order >= 0);

-- Add constraint: FAQ sort order must be non-negative
ALTER TABLE "faqs"
ADD CONSTRAINT "faq_sort_order_non_negative" CHECK (sort_order >= 0);

-- Add comments for documentation
COMMENT ON CONSTRAINT "invoice_amount_positive" ON "invoices" IS 'Ensures all invoice amounts are positive values';
COMMENT ON CONSTRAINT "paid_invoice_has_paid_at" ON "invoices" IS 'Ensures paid invoices always have a paidAt timestamp';
COMMENT ON CONSTRAINT "paid_at_after_created_at" ON "invoices" IS 'Ensures paidAt is always after createdAt when set';
COMMENT ON CONSTRAINT "retry_count_non_negative" ON "job_queue" IS 'Job retry count cannot be negative';
COMMENT ON CONSTRAINT "max_retries_positive" ON "job_queue" IS 'Maximum retry attempts must be positive';
COMMENT ON CONSTRAINT "retry_count_within_max" ON "job_queue" IS 'Current retry count cannot exceed max retries';
COMMENT ON CONSTRAINT "pricing_plan_price_positive" ON "pricing_plans" IS 'All pricing plan prices must be positive';
COMMENT ON CONSTRAINT "user_email_format" ON "users" IS 'Ensures email addresses have valid format';
COMMENT ON CONSTRAINT "pricing_plan_sort_order_non_negative" ON "pricing_plans" IS 'Sort order cannot be negative';
COMMENT ON CONSTRAINT "faq_sort_order_non_negative" ON "faqs" IS 'Sort order cannot be negative';
