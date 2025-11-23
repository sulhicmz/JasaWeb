<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.0.0 (initial constitution)
- List of modified principles: None (new constitution)
- Added sections: All core principles and governance sections
- Removed sections: None
- Templates requiring updates: .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md (⚠ pending)
- Follow-up TODOs: None
-->

# JasaWeb Constitution

## Core Principles

### I. Web Development Service Focus
Every feature supports the core mission of providing web development services for schools, news portals, and company profiles. All functionality must tie directly to client acquisition, retention, or project delivery. No features that don't serve our core business model.

### II. Client-First Experience
Every development decision must prioritize the client experience. Features and workflows must be intuitive for non-technical clients using the Client Portal. User interfaces should be simple, accessible, and provide clear status updates. All client-facing features must meet WCAG 2.2 AA accessibility standards.

### III. Test-First (NON-NEGOTIABLE)
TDD mandatory: Tests written → Requirements approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced. All code changes must include unit tests with minimum 80% coverage on critical paths. End-to-end tests required for all user-facing features before merge.

### IV. Multi-tenant Security & Data Isolation
All features must enforce strict data isolation between organizations. Every database query must include tenant filtering via organization_id. Authentication and authorization must be thoroughly validated for each request. Security-first approach: principle of least privilege, defense in depth, regular security audits.

### V. Performance & Reliability
All features must meet defined performance standards: API responses under 200ms average, page load times under 2 seconds, 99.9% uptime SLA. Performance budget must be maintained and validated in CI. All critical features must have monitoring and alerting implemented.

## Additional Constraints

### Technology Stack Requirements
The project follows a defined technology stack: Astro for frontend, NestJS for backend, PostgreSQL with Prisma ORM, Tailwind CSS, TypeScript, and pnpm monorepo. All dependencies must be justified and approved. No experimental technologies in critical paths without explicit approval and risk assessment.

### Deployment & Infrastructure
All features must be deployable via Docker containers with defined resource limits. Deployment must follow CI/CD pipeline with automated testing gates. All environments must be reproducible and match production as closely as possible. Rollback procedures must be tested and documented for all deployments.

## Development Workflow

### Code Review Process
All code changes require at least one approving review from a team member. PRs must pass all CI checks before review. Reviewers must verify: functionality meets requirements, tests are adequate, security implications considered, and code follows established patterns. PRs without clear documentation and testing will be rejected.

### Quality Gates
Code must pass all automated tests, linting, and security scans. Code coverage must maintain or improve. Performance metrics must meet defined thresholds. All new features require both unit and integration tests before merge. Breaking changes to existing functionality require explicit approval and migration plan.

## Governance

This constitution supersedes all other development practices. All PRs and code reviews must verify compliance with these principles. Amendments to this constitution require documentation, team review, and explicit approval. All team members are responsible for upholding these principles and ensuring compliance.

**Version**: 1.0.0 | **Ratified**: 2025-06-13 | **Last Amended**: 2025-11-22