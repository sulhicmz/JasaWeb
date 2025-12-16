# Blueprint

## Architecture
- Monorepo: `apps/web` (Astro), `apps/api` (NestJS), `packages/ui`, `packages/config`.
- Frontend: Astro + React. View Transitions (`ClientRouter`) enabled.
- Backend: NestJS.

## Consistency
- Linting: Strict linting enabled. `no-explicit-any` and `security` rules enforced.

## Testing
- API Contract Tests: Use manual instantiation for service testing to avoid dependency injection overhead and complexity in unit tests.

## File Management
- `FileController` delegates all logic to `FileService` for consistency.
- `FileService` handles both S3 and local storage abstractions.
- Filenames in DB match storage identifiers to ensure reliable retrieval.
