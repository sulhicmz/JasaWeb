# Simple Conflict Resolution Process

## 🎯 Principles
- **Fast resolution over perfect merging**
- **Communication over complex tools**
- **Small PRs over large changes**
- **Manual resolution over automation**

## 🔄 Conflict Prevention

### Before Starting Work
```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Keep branches small and focused
# Work on one feature at a time
```

### During Development
```bash
# Sync with main frequently (daily)
git fetch origin
git merge origin/main

# Commit often with clear messages
git add .
git commit -m "feat: add user authentication"

# Push regularly to avoid drift
git push origin feature/your-feature-name
```

## ⚡ Quick Conflict Resolution

### Step 1: Identify Conflict Type
```bash
# Pull latest changes
git pull origin main

# See what conflicts exist
git status
```

### Step 2: Resolve Common Conflicts

#### 📝 File Content Conflicts
```bash
# Open conflicted file
# Look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> main

# Manual resolution:
# 1. Understand both changes
# 2. Keep the correct version
# 3. Remove conflict markers
# 4. Test the result
```

#### 📦 Package.json Conflicts
```bash
# Always keep the highest version number
# Example:
# "dependencies": {
#   "react": "^18.0.0",    // Keep this
#   "react": "^18.2.0",    // Or this (higher)
# }

# After resolution:
npm install  # or pnpm install
```

#### 🔧 Configuration Conflicts
```bash
# For config files (tsconfig, eslint, etc.)
# - Prefer main branch version
# - Add your specific changes separately
# - Test configuration works
```

### Step 3: Test Resolution
```bash
# Quick validation
pnpm lint
pnpm typecheck
pnpm build

# If tests pass:
git add .
git commit -m "resolve: merge conflicts from main"
git push origin feature/your-feature-name
```

## 🚨 Emergency Resolution (When Stuck)

### Option 1: Reset and Reapply
```bash
# Save your work
git stash

# Reset to main
git reset --hard origin/main

# Reapply your changes
git stash pop

# Make smaller commits this time
git add -p  # Interactive add
git commit -m "feat: small change"
```

### Option 2: Use Merge Tool
```bash
# Use VS Code or other merge tool
git mergetool

# Or open in VS Code
code .
# Use built-in merge conflict resolver
```

### Option 3: Ask for Help
```bash
# Create a draft PR with conflicts
# Add comment: "Need help resolving conflicts"
# Tag team member for review
```

## 📋 Conflict Resolution Checklist

### Before Resolving
- [ ] I understand what both sides changed
- [ ] I have backed up my work
- [ ] I know which files are conflicted

### During Resolution
- [ ] I'm keeping the best version of each change
- [ ] I'm removing all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] I'm testing my changes after resolution

### After Resolution
- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] I've committed the resolution
- [ ] I've pushed the changes

## 🔄 Branch Management Strategy

### Small Branches (Recommended)
```bash
# Good: Small, focused branches
feature/user-login
feature/project-create
fix/auth-validation

# Avoid: Large, complex branches
feature/entire-user-system
refactor/all-the-things
```

### Branch Lifecycle
1. **Create**: From latest main
2. **Develop**: Small, frequent commits
3. **Sync**: Daily merges from main
4. **Test**: Before creating PR
5. **PR**: Keep it small and focused
6. **Merge**: Resolve conflicts quickly
7. **Delete**: Clean up after merge

## 🤝 Team Coordination

### Communication Rules
- **Announce** what you're working on
- **Coordinate** when working on related files
- **Review** PRs quickly (within 24 hours)
- **Communicate** about blocking changes

### Handoff Process
```bash
# When handing off work:
1. Create PR with clear description
2. Add reviewer comments
3. Link to related issues
4. Provide testing instructions
```

## ⚡ Quick Commands Reference

### Daily Sync
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main
```

### Conflict Resolution
```bash
git pull origin main
# Resolve conflicts manually
git add .
git commit -m "resolve: merge conflicts"
git push
```

### Emergency Reset
```bash
git stash
git reset --hard origin/main
git stash pop
```

## 📞 When to Get Help

### Get Help Immediately When:
- You don't understand the conflicts
- Tests fail after resolution
- Multiple developers working on same files
- Critical production issues

### How to Ask for Help:
1. **Describe** the problem clearly
2. **Show** the conflicted files
3. **Explain** what you tried
4. **Provide** error messages
5. **Tag** specific team members

---

**Remember**: Fast resolution is better than perfect resolution. When in doubt, ask for help!