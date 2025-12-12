# Bug Tracker

## Open Bugs

### HIGH
- [ ] **BUG-001**: `pnpm` command not recognized in environment - prevents build verification
  - **Workaround**: Run `pnpm install` manually in a terminal with pnpm installed

### MEDIUM
- [ ] **BUG-002**: React hydration warning when using `@jasaweb/ui` Button in Astro pages
  - **Workaround**: Use native HTML buttons in Astro pages or add `client:load` directive
  - **Affected**: `contact.astro` (reverted to native button)

### LOW
- [ ] **BUG-003**: Tailwind dynamic class `bg-${color}-500` not generating in Services page
  - **Workaround**: Use hardcoded classes or safelist in Tailwind config

---

## Fixed Bugs

### Iteration 2025-12-12
- [x] **BUG-004**: Mobile navigation links had light theme colors (`text-gray-700`)
  - **Fix**: Updated to `text-gray-300` in `Navigation.astro`

- [x] **BUG-005**: `packages/ui` missing `tsconfig.json` causing "Cannot find module 'react'" errors
  - **Fix**: Created `tsconfig.json` with proper React JSX configuration
