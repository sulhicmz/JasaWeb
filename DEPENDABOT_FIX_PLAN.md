# Fix Dependabot Configuration Inconsistencies

## Summary

This maintenance task addresses multiple issues in the Dependabot configuration that prevent automated dependency updates from working properly.

## Issues Identified

1. **Duplicate configurations**: Both `.github/dependabot.yml` and `.github/dependabot.json` exist
2. **Non-existent team references**: `jasaweb-team` and `jasaweb-maintainer` don't exist in the repository
3. **Missing testing package**: Configuration references `/packages/testing` which doesn't exist
4. **Inconsistent settings**: Different schedules and limits between the two files

## Changes Made

- Remove duplicate `.github/dependabot.json` file
- Keep and improve `.github/dependabot.yml` as the single source of truth
- Remove non-existent team references
- Remove reference to non-existent testing package
- Standardize update schedules and limits

## Risk Assessment

- **Risk Level**: Low
- **Impact**: Configuration-only changes, no code modifications
- **Rollback**: Simple - restore the original files
- **Testing**: Verify Dependabot can parse the configuration

## Checklist

- [x] Remove duplicate dependabot.json file
- [x] Clean up dependabot.yml configuration
- [x] Remove non-existent team references
- [x] Remove reference to missing testing package
- [x] Validate YAML syntax
- [ ] Create pull request for review
