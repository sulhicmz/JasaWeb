# Pull Request Cleanup Plan

## 📋 Current Open PRs Analysis

**Total Open PRs**: 30+
**Date**: November 22, 2025

## 🚨 Duplicate PRs - Priority for Closure

### Security PRs (JWT Secret Fix)
**PRs to consolidate:**
- #430: `security: Fix hardcoded JWT secret and TypeScript suppression issues` (Most comprehensive)
- #426: `fix: remove hardcoded JWT secret and fix TypeScript suppression` 
- #423: `[SECURITY] Fix hardcoded JWT secret and TypeScript suppression issues`

**Action**: Keep #430, close #426 and #423 as duplicates
**Reason**: #430 has the most comprehensive validation and testing coverage

### Testing Framework PRs (Jest Standardization)
**PRs to consolidate:**
- #406: `refactor: align testing framework on Jest across monorepo` (Most comprehensive)
- #404: `refactor: standardize on Jest testing framework across monorepo`
- #396: `refactor: standardize on Jest testing framework across monorepo`
- #387: `refactor: standardize on Jest testing framework across monorepo`
- #386: `refactor: standardize on Jest testing framework across monorepo`

**Action**: Keep #406, close #404, #396, #387, #386 as duplicates
**Reason**: #406 has the most complete workspace configuration and documentation

### Console Statement Removal PRs
**PRs to consolidate:**
- #419: `fix: Remove Console Statements from Production Code`
- #239: `fix: remove console statements from production code`
- #233: `fix: remove console statements and improve code security for CodeQL`

**Action**: Keep #419 (most recent), close #239 and #233 as duplicates
**Reason**: All address the same issue, #419 is most current

### Cloudflare Pages Configuration
**PRs to consolidate:**
- #235: `fix: configure Astro for proper Cloudflare Pages deployment`
- #230: `fix: configure Astro for proper Cloudflare Pages deployment`

**Action**: Keep #235, close #230 as duplicate
**Reason**: Likely addressing same build configuration issue

## 🔧 Stale PRs - Review and Close/Update

### Very Old PRs (> 30 days)
**Consider for closure if no recent activity:**
- #256: `feat: implement comprehensive knowledge base and self-service portal` (Nov 16)
- #244: `maintenance: fix missing testing package and clean up configurations` (Nov 16)
- #234: `Integrate prisma generate into root build script` (Nov 16)
- #228: `Add security scanning workflow for pnpm dependencies` (Nov 16)

**Action**: Review with maintainers - either update/close based on relevance

### PRs Overlapping with Recent Merges
**PRs that may be superseded:**
- #373: `ci(Mergify): configuration update` - Likely merged recently
- Any other PRs that were addressed in recent commits

## 📋 Cleanup Actions

### Immediate Actions (Today)
1. **Close duplicate security PRs** (#426, #423) with reference to #430
2. **Close duplicate testing PRs** (#404, #396, #387, #386) with reference to #406
3. **Close duplicate console PRs** (#239, #233) with reference to #419
4. **Close duplicate Cloudflare PR** (#230) with reference to #235

### Medium Priority Actions (This Week)
1. **Review stale PRs** with maintainers for relevance
2. **Update PR labels** to reflect current priorities
3. **Add `stale` label** to PRs needing attention
4. **Consolidate feature PRs** that address similar functionality

### Long-term Actions (This Month)
1. **Establish PR aging policy** - auto-close after 90 days of inactivity
2. **Implement duplicate detection** in PR submission process
3. **Enhance PR templates** to include conflict detection guidance
4. **Regular cleanup schedule** - monthly PR review

## 🏷️ Label Management for Cleanup

### New Labels to Add
- `duplicate` - Mark duplicate PRs
- `stale` - Mark inactive PRs
- `consolidate` - PRs that should be merged with others
- `on-hold` - PRs temporarily paused

### Label Cleanup Actions
1. Apply `duplicate` to identified duplicate PRs
2. Apply `stale` to PRs older than 30 days
3. Apply `needs-review` to PRs awaiting maintainer decision
4. Remove redundant labels

## 📊 Expected Results

### Before Cleanup
- **Open PRs**: 30+
- **Duplicate PRs**: ~10
- **Stale PRs**: ~8
- **Active discussions**: Scattered across duplicates

### After Cleanup
- **Open PRs**: ~15 (reduced by ~50%)
- **Duplicate PRs**: 0
- **Clearly labeled PRs**: 100%
- **Focused reviews**: Consolidated work

## 🔄 Ongoing Prevention

### Process Improvements
1. **Pre-creation checklist** to search for existing PRs
2. **Team communication** before starting major features
3. **GitHub issues requirement** for significant changes
4. **Regular sync meetings** to align ongoing work

### Automation Enhancements
1. **Duplicate detection** in PR submission
2. **Automatic stale labeling** after 30 days
3. **PR size validation** to encourage focused changes
4. **Integration with project management** tools

## 📝 Communication Plan

### For Duplicated PR Authors
- **Comment reference**: "Closed as duplicate of #XXX with more comprehensive changes"
- **Credit acknowledgment**: "Thanks for your work! This approach was incorporated in #XXX"
- **Future contribution**: Encourage participation in primary PR review

### For Team
- **Cleanup announcement**: Share results and lessons learned
- **Process reminder**: Emphasize new duplicate prevention measures
- **Success metrics**: Report improved PR management efficiency

---

**Implementation Status**: Ready for execution pending maintainer approval
**Next Review Date**: December 22, 2025 (30 days after cleanup)
