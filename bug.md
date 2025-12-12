# Bug Tracker

## Open Bugs

### HIGH

- [x] **BUG-001**: `pnpm` command not recognized in environment - prevents build verification
  - **Fix**: Used npm for build verification; TypeScript compilation errors resolved

### MEDIUM

- [ ] **BUG-002**: React hydration warning when using `@jasaweb/ui` Button in Astro pages
  - **Workaround**: Use native HTML buttons in Astro pages or add `client:load` directive
  - **Affected**: `contact.astro` (reverted to native button)

### LOW

- [ ] **BUG-003**: Tailwind dynamic class `bg-${color}-500` not generating in Services page
  - **Workaround**: Use hardcoded classes or safelist in Tailwind config

---

## Fixed Bugs

### Iteration 2025-12-12 (Critical Dashboard Fixes)

- [x] **BUG-006**: TypeScript compilation errors in dashboard module preventing client portal functionality
  - **Fix**: Updated Prisma schema with proper Milestone and Ticket models, fixed type annotations, resolved nullable date handling
  - **Impact**: Core dashboard and Gantt chart functionality now operational for project collaboration

- [x] **BUG-007**: Missing Prisma relations causing build failures in Gantt controller
  - **Fix**: Added proper relations and include statements for milestones and tickets
  - **Impact**: Project data can now be properly queried and displayed in dashboard

- [x] **BUG-008**: JWT module configuration type mismatch
  - **Fix**: Added proper type casting for expiresIn configuration
  - **Impact**: Authentication system now builds without type errors

### Iteration 2025-12-12

- [x] **BUG-004**: Mobile navigation links had light theme colors (`text-gray-700`)
  - **Fix**: Updated to `text-gray-300` in `Navigation.astro`

- [x] **BUG-005**: `packages/ui` missing `tsconfig.json` causing "Cannot find module 'react'" errors
  - **Fix**: Created `tsconfig.json` with proper React JSX configuration
