-- Data Integrity & Performance Optimization Migration - Down Script
-- Reverses all changes from migration 006
-- 
-- Safe & Reversible: Removes all constraints and indexes created in forward migration

-- ============================================
-- DROP PERFORMANCE OPTIMIZATION INDEXES
-- ============================================

-- Composite indexes for user management queries
DROP INDEX CONCURRENTLY IF EXISTS users_role_created_idx;

-- Composite indexes for invoice analytics
DROP INDEX CONCURRENTLY IF EXISTS invoices_status_paid_at_idx;

-- Composite indexes for project dashboard queries
DROP INDEX CONCURRENTLY IF EXISTS projects_user_status_created_idx;

-- Partial indexes for priority notifications
DROP INDEX CONCURRENTLY IF EXISTS real_time_notifications_priority_idx;

-- Partial indexes for unread real-time notifications
DROP INDEX CONCURRENTLY IF EXISTS real_time_notifications_unread_idx;

-- Partial indexes for active WebSocket message queue
DROP INDEX CONCURRENTLY IF EXISTS websocket_message_queue_active_idx;

-- Partial indexes for undelivered WebSocket events
DROP INDEX CONCURRENTLY IF EXISTS websocket_events_undelivered_idx;

-- Composite indexes for WebSocket connection management
DROP INDEX CONCURRENTLY IF EXISTS websocket_connections_alive_activity_idx;

-- Composite indexes for audit log queries (common patterns)
DROP INDEX CONCURRENTLY IF EXISTS audit_logs_resource_timestamp_idx;
DROP INDEX CONCURRENTLY IF EXISTS audit_logs_user_action_timestamp_idx;

-- Partial indexes for active FAQs
DROP INDEX CONCURRENTLY IF EXISTS faqs_active_idx;

-- Partial indexes for active pricing plans (optimizes pricing queries)
DROP INDEX CONCURRENTLY IF EXISTS pricing_plans_active_idx;

-- Partial indexes for published posts
DROP INDEX CONCURRENTLY IF EXISTS posts_published_idx;

-- Full-text search indexes for CMS pages
DROP INDEX CONCURRENTLY IF EXISTS pages_content_fts_idx;

-- Full-text search indexes for blog posts
DROP INDEX CONCURRENTLY IF EXISTS posts_title_fts_idx;
DROP INDEX CONCURRENTLY IF EXISTS posts_content_fts_idx;

-- ============================================
-- DROP DATA INTEGRITY CONSTRAINTS
-- ============================================

-- Ensure featured image URLs are valid if present
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_featured_image_format;

-- Ensure template URLs are valid
ALTER TABLE templates 
DROP CONSTRAINT IF EXISTS templates_url_format;

-- Ensure project URLs are valid if present
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_url_format;

-- Ensure phone number format (optional, but if present must be valid)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_phone_format;

-- Ensure email format is valid (basic validation)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_email_format;

-- Ensure sort orders are non-negative
ALTER TABLE faqs 
DROP CONSTRAINT IF EXISTS faqs_sort_order_non_negative;

ALTER TABLE pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_sort_order_non_negative;

-- Ensure pricing plan prices are always positive
ALTER TABLE pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_price_positive;

-- Ensure invoice amounts are always positive
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_amount_positive;
