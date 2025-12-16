import { SetMetadata } from '@nestjs/common';

export const SECURITY_KEY = 'security';

export interface SecurityMetadata {
  requireAuth?: boolean;
  rateLimitKey?: string;
  auditLog?: boolean;
  sensitiveOperation?: boolean;
  allowedRoles?: string[];
  maxRetries?: number;
}

export const Security = (metadata: SecurityMetadata) =>
  SetMetadata(SECURITY_KEY, metadata);

// Decorators for common security patterns
export const AuditLog = () => Security({ auditLog: true });
export const Sensitive = () => Security({ sensitiveOperation: true });
export const RequireAuth = (allowedRoles?: string[]) =>
  Security({ requireAuth: true, allowedRoles });
export const RateLimit = (key: string) => Security({ rateLimitKey: key });
