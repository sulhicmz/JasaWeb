# Task Progress

## Planned Tasks
- [ ] Stability: Increase test coverage (Unit & E2E) for both `apps/web` and `apps/api`.
- [ ] Security: Perform dependency vulnerability audit.
- [ ] Performance: Verify database indexing for critical queries.
- [ ] Performance: Implement image optimization strategy (e.g. build-time optimization or external service) compatible with Cloudflare.

## Completed Tasks
- [x] Stability: Standardize `ProjectService` tests - Migrated from Jest to Vitest syntax, fixed dependency injection with `unplugin-swc`, and aligned test logic with service implementation.
- [x] Consistency: Fix Lint Warnings - Fixed critical warnings in `notificationService.ts` and UI components. Disabled false positives.
- [x] Stability: Fix API Contract Tests - Updated `auth.contract.test.ts` to fix dependency injection and align mocks with service implementation.
- [x] Standardize: Refactor `FileService` and `FileController` - Eliminated duplication, fixed file upload bugs, resolved security warnings.
- [x] Stability: Fix `apps/web` build error - Enabled `ClientRouter` (View Transitions) and fixed esbuild configuration to correctly process Astro components.
- [x] Standardize: Refactor `notificationService.ts` - Removed `any` types, added proper interfaces, and fixed broken unit tests.
- [x] Standardize: Refactor `AnalyticsService` - Removed `any` types, consolidated interfaces, and fixed unit tests.
