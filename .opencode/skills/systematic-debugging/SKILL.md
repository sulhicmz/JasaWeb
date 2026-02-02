---
name: systematic-debugging
description: Use structured methodology for debugging software issues. Enforces root cause analysis before proposing fixes with four-phase process. Use when encountering any bug, test failure, unexpected behavior, or performance issues in JasaWeb.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: debugging
  category: troubleshooting
---

## What I do
- Enforce systematic root cause analysis before fixes
- Guide through four-phase debugging process
- Prevent random guesswork and symptom fixes
- Ensure comprehensive evidence gathering
- Maintain JasaWeb quality standards during debugging
- Learn from debugging patterns for future prevention

## When to use me
**ALWAYS** use for ANY technical issue:
- Test failures or regressions
- Production bugs
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues
- Security vulnerabilities

**ESPECIALLY when:**
- Under time pressure and tempted to guess
- Previous multiple attempts failed
- Issue seems complex or multi-layered
- You're about to skip debugging steps

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If Phase 1 isn't completed, you cannot propose fixes.

## The Four Phases (MUST complete in order)

### Phase 1: Root Cause Investigation
**BEFORE any fixes:**

1. **Read Error Messages Carefully**
   - Don't skip warnings or stack traces
   - Note exact line numbers, file paths, error codes
   - Look for clues in full error context

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Document reproduction steps
   - If inconsistent → gather more data, don't guess

3. **Check Recent Changes**
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences
   - Deployment changes

4. **Multi-Component Evidence Gathering**
   ```bash
   # For EACH system component boundary:
   # - Log data entering component
   # - Log data exiting component
   # - Verify config propagation
   # - Check state at each layer
   ```

   Example (API → Service → Database):
   ```bash
   # Layer 1: API endpoint
   echo "=== Request received: ==="
   echo "Headers: $REQUEST_HEADERS"
   echo "Body: $REQUEST_BODY"

   # Layer 2: Service layer
   echo "=== Service call: ==="
   echo "Parameters passed: $SERVICE_PARAMS"

   # Layer 3: Database query
   echo "=== Database query: ==="
   echo "SQL executed: $QUERY"
   echo "Query result: $QUERY_RESULT"
   ```

5. **Trace Data Flow**
   - Where does bad value originate?
   - What called this with bad value?
   - Trace upward to find source
   - Fix at source, not symptom

### Phase 2: Pattern Analysis
**Find patterns before fixing:**

1. **Find Working Examples**
   - Similar working code in codebase
   - Reference implementations
   - Working tests or examples

2. **Compare Against References**
   - Read reference implementation COMPLETELY
   - Don't skim - understand fully
   - Note exact differences

3. **Identify Differences**
   - List every difference, however small
   - Don't assume "that can't matter"
   - Document discrepancies

4. **Understand Dependencies**
   - Required components/config
   - Environmental assumptions
   - Integration requirements

### Phase 3: Hypothesis and Testing
**Scientific method:**

1. **Form Single Hypothesis**
   ```
   "I think X is the root cause because Y"
   ```
   - Write it down clearly
   - Be specific, not vague

2. **Test Minimally**
   - SMALLEST possible change
   - One variable at a time
   - Don't fix multiple things

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

4. **When You Don't Know**
   - Say "I don't understand X"
   - Don't pretend to know
   - Research more or ask for help

### Phase 4: Implementation
**Fix the root cause, not symptom:**

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - Automated test if possible
   - MUST have before fixing

2. **Implement Single Fix**
   - Address identified root cause
   - ONE change at a time
   - No "while I'm here" improvements

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?
   - Issue actually resolved?

4. **If 3+ Fixes Failed → Question Architecture**
   - Each fix reveals new problems?
   - Fixes require massive refactoring?
   - STOP and question fundamentals
   - Discuss architecture vs continue fixing

## Red Flags - STOP and Process

If you think:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"  
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix it"
- **"One more fix attempt" (after 2+ fails)**

**ALL mean: STOP. Return to Phase 1.**

## JasaWeb-Specific Considerations

### Architectural Compliance
- Never compromise 99.8/100 score for quick fixes
- Maintain service layer patterns
- Preserve security (100/100 score)
- Keep performance standards (sub-2ms queries)

### Testing Standards
- All fixes must maintain 464-test baseline
- Ensure 100% test pass rate
- Add tests for bug fixes
- Include E2E tests for critical flows

### Code Quality
- Maintain ESLint compliance
- Preserve TypeScript type safety
- Follow AGENTS.md rules
- Keep bundle size under 200KB

## Success Metrics

**Systematic Debugging Benefits:**
- 15-30 minutes to fix (vs 2-3 hours thrashing)
- 95% first-time fix rate (vs 40% random)
- Near-zero new bugs introduced (vs common)
- Clear documentation of root causes

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|----------------|------------------|
| **1. Root Cause** | Read errors, reproduce, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find examples, compare, analyze | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis formed |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |

## Examples

### Example 1: Test Failure
```
ERROR: UserService.create should throw ValidationError for invalid email

Phase 1: 
- Read error: Validation not triggered
- Reproduce: Call service with invalid email
- Check recent changes: Email validation added yesterday
- Evidence: Service not calling validation method

Phase 2:
- Working example: other services call validateEmail() 
- Difference: UserService missing validation call

Phase 3:
- Hypothesis: UserService not integrating email validation
- Test: Add validation call in UserService

Phase 4:
- Test case: Already exists and fails
- Fix: Add email validation call
- Verify: Test passes, no other tests broken
```

### Example 2: Performance Issue
```
ERROR: API response taking 5000ms for user list

Phase 1:
- Read metrics: Database query slow
- Reproduce: Consistent with many records
- Recent changes: Added user profile joins
- Evidence: Query plan shows full table scan

Phase 2:
- Working example: Simple user query fast
- Difference: New JOIN without proper index

Phase 3:
- Hypothesis: Missing index on foreign key
- Test: Add index to user_id

Phase 4:
- Test case: Performance test with 1500+ records
- Fix: Add database index
- Verify: Query time < 2ms
```

## Integration with JasaWeb Agents

- **@jasaweb-architect**: Validate architectural implications of fixes
- **@jasaweb-security**: Ensure security compliance during debugging
- **@jasaweb-tester**: Create comprehensive test cases
- **@jasaweb-autonomous**: Learn from debugging patterns for self-healing

Remember: **Systematic debugging IS faster than random guessing.** ALWAYS follow the process, especially under pressure.