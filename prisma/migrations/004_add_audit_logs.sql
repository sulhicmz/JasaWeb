-- Add audit logs table for compliance and security
-- Creates comprehensive audit trail for all sensitive operations

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for optimal query performance
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
CREATE INDEX audit_logs_resource_idx ON audit_logs(resource);
CREATE INDEX audit_logs_timestamp_idx ON audit_logs(timestamp);
CREATE INDEX audit_logs_resource_timestamp_idx ON audit_logs(resource, resource_id);
CREATE INDEX audit_logs_timestamp_action_idx ON audit_logs(timestamp, action);
CREATE INDEX audit_logs_user_timestamp_idx ON audit_logs(user_id, timestamp);

-- Ensure constraint for valid action types
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check 
CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 
    'PAYMENT_INIT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
    'EXPORT', 'IMPORT', 'ROLE_CHANGE'
));

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for sensitive operations including authentication, payments, and admin actions';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL for system operations)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type that was accessed';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state of the resource (for UPDATE/DELETE)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state of the resource (for CREATE/UPDATE)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN audit_logs.user_agent IS 'Client user agent string';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred';