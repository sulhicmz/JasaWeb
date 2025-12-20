# AGENTS.md - JasaWeb Coding Standards

**STRICT RULES FOR AI AGENTS & CONTRIBUTORS**

> These rules are NON-NEGOTIABLE. Violations break consistency.

---

## 1. File Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI primitives (Button, Card, etc.)
│   ├── Header.astro  # Global components
│   └── Footer.astro
├── layouts/
│   ├── Layout.astro      # Base HTML layout
│   └── PageLayout.astro  # Header + main + Footer wrapper
├── lib/
│   ├── config.ts    # Site config, services, pricing (SINGLE SOURCE OF TRUTH)
│   ├── types.ts     # All TypeScript interfaces
│   ├── api.ts       # API response utilities
│   ├── auth.ts      # Authentication
│   ├── prisma.ts    # Database client
│   ├── kv.ts        # Cache service
│   └── r2.ts        # Storage service
├── pages/
│   ├── api/         # API endpoints only
│   └── *.astro      # Page components
```

---

## 2. Strict Rules

### Data & Config
- **NEVER** hardcode data in pages. Use `src/lib/config.ts`.
- **ALWAYS** import types from `src/lib/types.ts`.
- **ALWAYS** use `siteConfig` for site name, tagline, etc.

### Development Tools (STRICT)
- **ALWAYS** use `pnpm` for package management. `npm` and `yarn` are FORBIDDEN.
- **ALWAYS** use `Vitest` for testing.
- **ALWAYS** run `pnpm typecheck` before pushing.

### Components
- **ALWAYS** use `PageLayout.astro` for public pages.
- **ALWAYS** use UI components from `src/components/ui/`.
- **NEVER** create one-off styled buttons or cards in pages.

### API Responses
- **ALWAYS** use `jsonResponse()`, `errorResponse()` from `src/lib/api.ts`.
- **NEVER** manually construct Response objects in API routes.
- **ALWAYS** validate with `validateRequired()` before processing.

### Styling
- **ALWAYS** use CSS variables from `Layout.astro` (e.g., `var(--color-primary)`).
- **NEVER** use hardcoded colors like `#6366f1`. Use `var(--color-primary)`.
- **ALWAYS** follow the spacing scale: `sm`, `md`, `lg`, `xl`.

### Naming
- **Files**: kebab-case (e.g., `page-layout.astro`)
- **Components**: PascalCase (e.g., `PageLayout`)
- **Functions**: camelCase (e.g., `getServiceById`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `AUTH_COOKIE`)

### Security
- **ALWAYS** implement `checkRateLimit` on public POST/PUT/DELETE routes.
- **WARNING**: Rate limiting implementation has sliding window behavior, not fixed window as expected.

### Critical Warnings 
- **RATE LIMITING IMPLEMENTATION FLAW**: Current sliding window behavior in `src/lib/rate-limit.ts:74` may allow abuse. Use fixed window patterns or third-party service for production.
- **CSRF PROTECTION MISSING**: No explicit CSRF protection for authenticated routes. Implement CSRF tokens for state-changing operations.
- **LIMITED TEST COVERAGE**: Only utility functions have tests. CRITICAL paths (API routes, auth flow, components) are untested.
- **ERROR BOUNDARY USAGE**: ErrorBoundary exists but not consistently used across React islands. Apply to all interactive components.
- **PRODUCTION SECURITY**: Review secret management and implement JWT rotation strategy before production deployment.

---

## 3. Component Patterns

### UI Components MUST have:
```typescript
export interface Props {
  variant?: 'primary' | 'secondary' | '...';
  size?: 'sm' | 'md' | 'lg';
  class?: string;  // Allow className override
}
```

### API Routes MUST use:
```typescript
import { jsonResponse, errorResponse, validateRequired } from '@/lib/api';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const error = validateRequired(body, ['field1', 'field2']);
    if (error) return errorResponse(error);
    
    // ... logic
    return jsonResponse(result);
  } catch (e) {
    return handleApiError(e);
  }
};
```

### Rate Limiting
- **ALWAYS** usage `checkRateLimit` for sensitive endpoints (auth, payment).

### Stability & Resilience
- **ALWAYS** wrap React islands with `ErrorBoundary` from `@/components/common/ErrorBoundary`.
- **CRITICAL**: ErrorBoundary has bugs - use `this.props.fallback` NOT `this.fallback`.
- **ALWAYS** add unit tests for new logic in `src/lib/`.
- **IMPORTANT**: Run `pnpm typecheck` before any commit - currently passes with 0 errors.
- **NEVER** use `any` type. Use proper interfaces in `types.ts`.
- **EXCEPTION**: Cloudflare Workers types use `any` due to missing type definitions. Add inline type aliases in service files.
- **RATE LIMITING**: Fixed window implementation now in `src/lib/rate-limit.ts` using timestamp-based keys for consistent window boundaries.
- **CSRF**: Implemented CSRF protection for authenticated state-changing operations. Use `x-csrf-token` header and `jasaweb_csrf` cookie.
```

---

## 4. CSS Variables Reference

```css
/* Colors */
--color-primary: #6366f1;
--color-primary-dark: #4f46e5;
--color-secondary: #f59e0b;
--color-success: #10b981;
--color-error: #ef4444;

/* Backgrounds */
--color-bg: #0f172a;
--color-bg-secondary: #1e293b;
--color-bg-tertiary: #334155;

/* Text */
--color-text: #f8fafc;
--color-text-secondary: #94a3b8;
--color-text-muted: #64748b;

/* Border */
--color-border: #334155;

/* Radius */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
```

---

## 5. Checklist Before Committing

- [ ] No hardcoded strings/colors/data
- [ ] Using PageLayout for pages
- [ ] Using UI components from `ui/`
- [ ] Types imported from `types.ts`
- [ ] API uses standardized responses
- [ ] CSS uses design tokens only
