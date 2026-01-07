-- Rollback Migration: Remove Data Integrity Constraints
-- Created: 2025-01-07
-- Purpose: Revert constraint additions for data integrity

-- Remove constraint: FAQ sort order must be non-negative
ALTER TABLE "faqs" DROP CONSTRAINT IF EXISTS "faq_sort_order_non_negative";

-- Remove constraint: Pricing plan sort order must be non-negative
ALTER TABLE "pricing_plans" DROP CONSTRAINT IF EXISTS "pricing_plan_sort_order_non_negative";

-- Remove constraint: Email format validation
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "user_email_format";

-- Remove constraint: Pricing plan prices must be positive
ALTER TABLE "pricing_plans" DROP CONSTRAINT IF EXISTS "pricing_plan_price_positive";

-- Remove constraint: Retry count cannot exceed max retries
ALTER TABLE "job_queue" DROP CONSTRAINT IF EXISTS "retry_count_within_max";

-- Remove constraint: Max retries must be positive
ALTER TABLE "job_queue" DROP CONSTRAINT IF EXISTS "max_retries_positive";

-- Remove constraint: Retry count must be non-negative
ALTER TABLE "job_queue" DROP CONSTRAINT IF EXISTS "retry_count_non_negative";

-- Remove constraint: Paid invoice's paidAt must be after createdAt
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "paid_at_after_created_at";

-- Remove constraint: Paid invoice must have paidAt date
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "paid_invoice_has_paid_at";

-- Remove constraint: Invoice amounts must be positive
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoice_amount_positive";

-- Rollback complete - all data integrity constraints removed
