# Optimization Plan - Project Statistics Aggregation

## Current Observations

- `ProjectService.getProjectStats` fetches full lists of milestones, approvals, and tasks just to derive counts, which wastes memory and network bandwidth for large projects.
- The method performs multiple Prisma queries sequentially (including verification through `findUnique`), delaying the response while awaiting each round-trip.
- The multi-tenant Prisma wrapper lacks `count` helpers, forcing services to over-fetch instead of running lightweight aggregate queries.

## Objectives

1. Minimize the amount of data transferred when assembling project dashboards.
2. Reduce overall latency for `getProjectStats` by parallelising independent database operations.
3. Provide reusable `count` helpers within `MultiTenantPrismaService` so other modules can avoid similar over-fetching in the future.

## Proposed Improvements

- Extend `MultiTenantPrismaService` with `count` helpers for milestones, approvals, tasks, and files that automatically scope queries to the active organization.
- Refactor `ProjectService.getProjectStats` to:
  - Fetch only the metadata required to confirm project ownership and obtain aggregate totals via `_count`.
  - Use the new scoped `count` helpers to compute filtered counts (completed milestones/tasks and pending approvals) without retrieving entire record lists.
  - Execute the filtered count queries with `Promise.all` to parallelise independent work.
- Keep the existing response structure so downstream consumers remain unaffected.

## Expected Impact

- Lower memory usage and CPU overhead on the API server by avoiding unnecessary record materialisation.
- Faster response times for project dashboard endpoints due to fewer sequential database calls.
- Improved maintainability via centralized count logic that respects tenant boundaries by default.
