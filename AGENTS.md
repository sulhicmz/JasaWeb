# Repository Guidelines

## Project Structure & Module Organization
This repo is in the early planning stage; keep `README.md` as the public overview and `plan.md` as the product/architecture source of truth. When scaffolding the codebase, mirror the proposed monorepo layout: `apps/web` for the Astro marketing site, `apps/api` for the portal API, and `packages/ui` / `packages/config` for shared assets. Place integration tests under `apps/**/tests` and shared fixtures in `packages/testing`. Assets for the public site belong in `apps/web/public`, while portal uploads flow through S3 in production but use `apps/api/storage` mocks locally.

## Build, Test, and Development Commands
Use Node 20+ and pnpm workspaces (`corepack enable`). Typical flows:
- `pnpm install` — install root + workspace dependencies.
- `pnpm dev --filter apps/web` — run the Astro site locally at `localhost:4321`.
- `pnpm dev --filter apps/api` — start the NestJS API with hot reload.
- `pnpm build` — build all workspaces via the shared pipeline.
- `pnpm lint` / `pnpm format` — run ESLint and Prettier across the tree.

## Coding Style & Naming Conventions
Adopt Prettier defaults (two-space indent, single quotes in TS/JS) and Tailwind utility-first styling. Co-locate components by feature; favor folders such as `apps/web/src/features/<domain>` and `apps/api/src/modules/<domain>`. Use PascalCase for React/Astro components, camelCase for variables/functions, SCREAMING_SNAKE_CASE for env keys. Store environment defaults in `.env.example` and never commit real secrets.

## Testing Guidelines
Prefer Vitest for unit tests (`*.test.ts`) and Playwright for end-to-end portal flows (`apps/web/tests/e2e`). Keep contract tests for the API in `apps/api/tests/contracts`. Aim for ≥80% critical-path coverage and include regression cases for approvals, ticket SLAs, and billing workflows. Run `pnpm test` locally before every push and ensure CI is green prior to merge.

## Commit & Pull Request Guidelines
Existing history is short, using plain imperative summaries (e.g., "Update README.md"); continue with clear, scoped messages or adopt Conventional Commits if automation is added. Keep feature branches focused, link related issues, and describe migrations or seed data in the PR body. Attach screenshots or terminal output for UI changes and note any config updates that reviewers must apply.

## Security & Configuration Tips
Follow the risk controls in `plan.md`: enforce RBAC, protect secrets with Doppler or 1Password, and enable 2FA on all integrations. Sanitize client uploads, log access decisions, and document infra changes in deployment runbooks.
