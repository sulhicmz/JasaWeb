#!/bin/bash

# JasaWeb Project Board Setup Script
# This script helps set up the GitHub Project board with proper configuration

set -e

echo "🚀 Setting up JasaWeb Project Board..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "Visit: https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

REPO="sulhicmz/JasaWeb"
echo "📋 Repository: $REPO"

# Create the project board
echo "📊 Creating project board..."
PROJECT_ID=$(gh project create --owner "$REPO" --title "JasaWeb Development Board" --format json | jq -r '.id')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Failed to create project board. It might already exist."
    # Try to get existing project
    PROJECT_ID=$(gh project list --owner "$REPO" --limit 1 --format json | jq -r '.[0].id')
    if [ -z "$PROJECT_ID" ]; then
        echo "❌ Could not find existing project board."
        exit 1
    fi
    echo "✅ Found existing project board: $PROJECT_ID"
else
    echo "✅ Created project board: $PROJECT_ID"
fi

# Store project ID
echo "$PROJECT_ID" > .github/project-id.txt
echo "💾 Stored project ID in .github/project-id.txt"

# Create columns
echo "📋 Creating project columns..."
COLUMNS=(
    "🆕 Triage"
    "📋 Backlog"
    "🚧 In Progress"
    "👀 Review"
    "🧪 Testing"
    "✅ Done"
    "🚫 Blocked"
    "❌ Won't Fix"
)

for column in "${COLUMNS[@]}"; do
    echo "  - Creating column: $column"
    gh project item-create --project "$PROJECT_ID" --title "$column" --type "ProjectColumn" || echo "    ⚠️ Column might already exist"
done

# Create views
echo "👁️ Creating project views..."

# Main Board View
gh project view-create --project "$PROJECT_ID" --title "Main Board" --layout "table" --filters "status:open" || echo "    ⚠️ View might already exist"

# Security Issues View
gh project view-create --project "$PROJECT_ID" --title "Security Issues" --layout "table" --filters "label:security" || echo "    ⚠️ View might already exist"

# Build & CI/CD View
gh project view-create --project "$PROJECT_ID" --title "Build & CI/CD" --layout "board" --filters "label:CI/CD,label:build,label:deployment" || echo "    ⚠️ View might already exist"

# Dependencies View
gh project view-create --project "$PROJECT_ID" --title "Dependencies" --layout "list" --filters "label:dependencies" || echo "    ⚠️ View might already exist"

# Sprint Planning View
gh project view-create --project "$PROJECT_ID" --title "Sprint Planning" --layout "board" --filters "milestone:current" || echo "    ⚠️ View might already exist"

# Create custom fields
echo "🏷️ Creating custom fields..."

# Priority field
gh project field-create --project "$PROJECT_ID" --name "Priority" --data-type "SINGLE_SELECT" --options "Critical,High,Medium,Low" || echo "    ⚠️ Field might already exist"

# Severity field
gh project field-create --project "$PROJECT_ID" --name "Severity" --data-type "SINGLE_SELECT" --options "Critical,High,Medium,Low" || echo "    ⚠️ Field might already exist"

# Issue Type field
gh project field-create --project "$PROJECT_ID" --name "Issue Type" --data-type "SINGLE_SELECT" --options "Bug,Feature,Enhancement,Documentation,Technical Task,Security,Infrastructure,UI/UX" || echo "    ⚠️ Field might already exist"

# Component field
gh project field-create --project "$PROJECT_ID" --name "Component" --data-type "SINGLE_SELECT" --options "Frontend,Backend,Database,Docker/Infrastructure,Security,CI/CD,Dependencies,Documentation" || echo "    ⚠️ Field might already exist"

# PR Link field
gh project field-create --project "$PROJECT_ID" --name "PR Link" --data-type "TEXT" || echo "    ⚠️ Field might already exist"

# Story Points field
gh project field-create --project "$PROJECT_ID" --name "Story Points" --data-type "NUMBER" || echo "    ⚠️ Field might already exist"

# Target Release field
gh project field-create --project "$PROJECT_ID" --name "Target Release" --data-type "SINGLE_SELECT" --options "v1.0.0 (MVP),v1.1.0 (Enhancement),v1.2.0 (Performance),v2.0.0 (Major)" || echo "    ⚠️ Field might already exist"

# Import existing issues
echo "📥 Importing existing issues..."
ISSUES=$(gh issue list --repo "$REPO" --limit 100 --json number,title,labels,state)

echo "$ISSUES" | jq -c '.[]' | while read -r issue; do
    ISSUE_NUMBER=$(echo "$issue" | jq -r '.number')
    ISSUE_TITLE=$(echo "$issue" | jq -r '.title')
    ISSUE_STATE=$(echo "$issue" | jq -r '.state')
    
    echo "  - Processing issue #$ISSUE_NUMBER: $ISSUE_TITLE"
    
    if [ "$ISSUE_STATE" = "open" ]; then
        # Add to Triage column for open issues
        gh project item-add --project "$PROJECT_ID" --issue "$ISSUE_NUMBER" --column "🆕 Triage" || echo "    ⚠️ Could not add to project"
    fi
    
    # Add special labels for master issues
    if [[ "$ISSUE_NUMBER" =~ ^(99|100|101|102)$ ]]; then
        echo "    🎯 Adding master-issue label to #$ISSUE_NUMBER"
        gh issue edit "$ISSUE_NUMBER" --repo "$REPO" --add-label "master-issue,high-priority" || echo "    ⚠️ Could not add labels"
    fi
done

# Set up automation workflow
echo "⚙️ Setting up automation workflow..."
if [ -f ".github/workflows/project-board-automation.yml" ]; then
    echo "✅ Automation workflow already exists"
else
    echo "❌ Automation workflow not found. Please ensure project-board-automation.yml is in .github/workflows/"
fi

# Create documentation
echo "📚 Creating project documentation..."
cat > .github/PROJECT_BOARD_GUIDE.md << 'EOF'
# 🗂️ JasaWeb Project Board Guide

## 📋 Overview
This guide explains how to use the JasaWeb Development Board for effective issue tracking and workflow management.

## 🔄 Workflow Stages

### 1. 🆕 Triage
- New issues start here
- Automatic categorization applied
- Team reviews and prioritizes
- Move to Backlog when ready

### 2. 📋 Backlog
- Prioritized but not scheduled
- Ready for assignment
- Organized by priority and milestone

### 3. 🚧 In Progress
- Currently being worked on
- Assigned to team member
- Regular updates expected

### 4. 👀 Review
- Code ready for review
- PR linked and waiting for approval
- Review team assigned

### 5. 🧪 Testing
- Approved code in testing
- QA team validation
- Bug fixes if needed

### 6. ✅ Done
- Completed and merged
- Issue closed
- Documentation updated

### 7. 🚫 Blocked
- Waiting for dependencies
- External blockers
- Needs escalation

### 8. ❌ Won't Fix
- Out of scope
- Not applicable
- Documented reason

## 🏷️ Custom Fields

### Priority
- 🔴 **Critical**: Immediate attention required
- 🟠 **High**: High priority, address soon
- 🟡 **Medium**: Normal priority
- 🔵 **Low**: Nice to have, low urgency

### Severity
- 🚨 **Critical**: Security breach, production down
- ⚠️ **High**: Major functionality broken
- 📝 **Medium**: Partial functionality affected
- 💡 **Low**: Minor issues or improvements

### Issue Type
- 🐛 **Bug**: Something isn't working
- ✨ **Feature**: New functionality
- 🔧 **Enhancement**: Improvement to existing
- 📚 **Documentation**: Docs and guides
- 🛠️ **Technical Task**: Technical work
- 🔒 **Security**: Security-related
- 🏗️ **Infrastructure**: DevOps and deployment
- 🎨 **UI/UX**: User interface and experience

### Component
- 🌐 **Frontend**: Web application (apps/web)
- ⚙️ **Backend**: API server (apps/api)
- 🗄️ **Database**: Database and migrations
- 🐳 **Docker/Infrastructure**: Containers and deployment
- 🔐 **Security**: Security and authentication
- 📊 **CI/CD**: Build and deployment pipelines
- 📦 **Dependencies**: Package management
- 📖 **Documentation**: Project documentation

## 🤖 Automation

### Automatic Triage
- New issues get `triage` label
- Priority assigned based on keywords
- Component detected from content
- Type categorized automatically

### Status Updates
- PR linked → Move to Review
- PR merged → Move to Done
- Inactivity → Stale notifications
- Security issues → Escalated to maintainers

### Master Issues
- Issues #99, #100, #101, #102 tracked specially
- Auto-labeled as master-issue
- High priority automatically assigned
- Progress monitored closely

## 👁️ Views

### Main Board
- Complete workflow visualization
- All issues by status
- Full field visibility

### Security Issues
- Security-related issues only
- Priority and severity focus
- Quick access for security team

### Build & CI/CD
- Build and deployment issues
- Environment-specific tracking
- Infrastructure team focus

### Dependencies
- Dependency management
- Security vulnerabilities
- Update tracking

### Sprint Planning
- Current sprint focus
- Team assignment view
- Capacity planning

## 📊 Best Practices

### Issue Creation
1. Use descriptive titles
2. Provide detailed descriptions
3. Include reproduction steps for bugs
4. Add appropriate labels
5. Set realistic priority

### Workflow Management
1. Move issues through stages promptly
2. Update status regularly
3. Link PRs when created
4. Close issues when completed
5. Document decisions

### Team Collaboration
1. Review triage daily
2. Assign issues promptly
3. Provide regular updates
4. Respond to reviews quickly
5. Participate in sprint planning

## 🔧 Troubleshooting

### Issue Not in Project Board
1. Check if issue is open
2. Verify project permissions
3. Try adding manually
4. Check automation logs

### Automation Not Working
1. Check workflow runs
2. Verify permissions
3. Review error logs
4. Manually trigger workflow

### Labels Not Applied
1. Check label names
2. Verify automation rules
3. Add labels manually
4. Review issue content

## 📞 Support

For questions or issues with the project board:
1. Check this guide first
2. Review automation logs
3. Create an issue with `project-board` label
4. Contact maintainers directly

---
*Last updated: $(date)*
EOF

echo "✅ Project documentation created"

# Summary
echo ""
echo "🎉 Project Board Setup Complete!"
echo ""
echo "📊 Project Board Details:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Repository: $REPO"
echo "  - Columns: ${#COLUMNS[@]} workflow stages"
echo "  - Views: 5 specialized views"
echo "  - Custom Fields: 7 fields configured"
echo ""
echo "📋 Next Steps:"
echo "  1. Visit the project board at: https://github.com/$REPO/projects/$PROJECT_ID"
echo "  2. Review the imported issues"
echo "  3. Test the automation workflow"
echo "  4. Train the team on the new workflow"
echo "  5. Monitor and adjust as needed"
echo ""
echo "📚 Documentation:"
echo "  - Project Board Guide: .github/PROJECT_BOARD_GUIDE.md"
echo "  - Configuration: .github/PROJECT_BOARD_CONFIG.md"
echo "  - Automation: .github/workflows/project-board-automation.yml"
echo ""
echo "🚀 Your JasaWeb project board is ready to use!"