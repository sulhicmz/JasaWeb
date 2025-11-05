# Branch Protection Rules Configuration

## Main Branch Protection
Branch: `main`

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Required status checks:
  - `lint`
  - `typecheck`
  - `test`
  - `build`
  - `security`

### Enforce Admins
- [x] Include administrators

### Required Pull Request Reviews
- [x] Require approval for pull requests
- [x] Required approving reviews: 2
- [x] Dismiss stale PR approvals when new commits are pushed
- [x] Require review from Code Owners
- [x] Restrict reviews from collaborators who dismiss reviews
- [x] Limit to users with write access in the repository
- [x] Require approval for PR edits by collaborators

### Other Restrictions
- [x] Limit who can push to matching branches
- [x] Allow force pushes: No
- [x] Allow deletions: No

## Develop Branch Protection
Branch: `develop`

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Required status checks:
  - `lint`
  - `typecheck`
  - `test`

### Enforce Admins
- [x] Include administrators

### Required Pull Request Reviews
- [x] Require approval for pull requests
- [x] Required approving reviews: 1
- [x] Dismiss stale PR approvals when new commits are pushed

### Other Restrictions
- [x] Allow force pushes: Yes (for maintainers only)
- [x] Allow deletions: No

## Release Branch Protection
Pattern: `release/*`

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Required status checks:
  - `lint`
  - `typecheck`
  - `test`
  - `build`
  - `security`

### Enforce Admins
- [x] Include administrators

### Required Pull Request Reviews
- [x] Require approval for pull requests
- [x] Required approving reviews: 2
- [x] Dismiss stale PR approvals when new commits are pushed
- [x] Require review from Code Owners

### Other Restrictions
- [x] Allow force pushes: No
- [x] Allow deletions: No