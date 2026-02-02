#!/bin/bash

#!/bin/bash

echo "🔍 JasaWeb OpenCode Integration Verification"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

echo ""
echo "📋 Checking OpenCode CLI Installation..."
if command -v opencode &> /dev/null; then
    VERSION=$(opencode --version 2>/dev/null)
    print_status 0 "OpenCode CLI installed (v$VERSION)"
else
    print_status 1 "OpenCode CLI not found"
    exit 1
fi

echo ""
echo "📦 Checking Plugin Installation..."
if npm list -g oh-my-opencode &> /dev/null; then
    OMO_VERSION=$(npm list -g oh-my-opencode | grep oh-my-opencode | head -1 | awk '{print $2}')
    print_status 0 "oh-my-opencode plugin installed ($OMO_VERSION)"
else
    print_status 1 "oh-my-opencode plugin not found"
fi

if npm list -g opencode-antigravity-auth &> /dev/null; then
    AG_VERSION=$(npm list -g opencode-antigravity-auth | grep opencode-antigravity-auth | head -1 | awk '{print $2}')
    print_status 0 "opencode-antigravity-auth plugin installed ($AG_VERSION)"
else
    print_status 1 "opencode-antigravity-auth plugin not found"
fi

echo ""
echo "📁 Checking .opencode Directory Structure..."
DIRECTORIES=("agents" "skills" "commands" "tools")
for dir in "${DIRECTORIES[@]}"; do
    if [ -d ".opencode/$dir" ]; then
        print_status 0 ".opencode/$dir directory exists"
    else
        print_status 1 ".opencode/$dir directory missing"
    fi
done

echo ""
echo "🤖 Checking JasaWeb Agents..."
AGENTS=("jasaweb-architect" "jasaweb-developer" "jasaweb-security" "jasaweb-tester" "jasaweb-autonomous")
for agent in "${AGENTS[@]}"; do
    if opencode agent list 2>/dev/null | grep -q "$agent"; then
        print_status 0 "$agent agent configured"
    else
        print_status 1 "$agent agent not found"
    fi
done

echo ""
echo "📄 Checking Configuration Files..."
CONFIG_FILES=("opencode.json" "oh-my-opencode.json" "antigravity.json" "README.md")
for config in "${CONFIG_FILES[@]}"; do
    if [ -f ".opencode/$config" ]; then
        print_status 0 ".opencode/$config exists"
    else
        print_status 1 ".opencode/$config missing"
    fi
done

echo ""
echo "🛠️ Checking Skills and Commands..."
SKILLS=("skill-builder" "backend-models" "systematic-debugging" "moai-opencode" "memory-systems" "autonomous-agent" "jasaweb-setup")
for skill in "${SKILLS[@]}"; do
    if [ -d ".opencode/skills/$skill" ] && [ -f ".opencode/skills/$skill/SKILL.md" ]; then
        print_status 0 "$skill skill created"
        
        if head -1 ".opencode/skills/$skill/SKILL.md" | grep -q "^---"; then
            echo -e "  ✓ Has proper YAML frontmatter"
        else
            echo -e "  ✗ Missing YAML frontmatter"
        fi
        
        if grep -q "name: $skill" ".opencode/skills/$skill/SKILL.md"; then
            echo -e "  ✓ Name field matches directory"
        else
            echo -e "  ✗ Name field doesn't match directory"
        fi
    else
        print_status 1 "$skill skill missing"
    fi
done

if [ -f ".opencode/commands/jasaweb-audit.md" ]; then
    print_status 0 "jasaweb-audit command created"
else
    print_status 1 "jasaweb-audit command missing"
fi

echo ""
echo "🔐 Checking Authentication..."
AUTH_COUNT=$(opencode auth list 2>/dev/null | grep -c "credentials\|environment" || echo "0")
if [ "$AUTH_COUNT" -gt 0 ]; then
    print_status 0 "Authentication configured ($AUTH_COUNT credentials/providers)"
else
    print_warning "No authentication configured - Google OAuth needed for antigravity models"
fi

echo ""
echo "📊 Integration Summary:"
echo "======================="

# Count successful checks
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Simple count based on our checks above
((TOTAL_CHECKS++))
if command -v opencode &> /dev/null; then ((PASSED_CHECKS++)); fi

((TOTAL_CHECKS++))
if npm list -g oh-my-opencode &> /dev/null; then ((PASSED_CHECKS++)); fi

((TOTAL_CHECKS++))
if npm list -g opencode-antigravity-auth &> /dev/null; then ((PASSED_CHECKS++)); fi

for dir in "${DIRECTORIES[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -d ".opencode/$dir" ]; then ((PASSED_CHECKS++)); fi
done

for agent in "${AGENTS[@]}"; do
    ((TOTAL_CHECKS++))
    if opencode agent list 2>/dev/null | grep -q "$agent"; then ((PASSED_CHECKS++)); fi
done

for config in "${CONFIG_FILES[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -f ".opencode/$config" ]; then ((PASSED_CHECKS++)); fi
done

((TOTAL_CHECKS++))
if [ -f ".opencode/skills/jasaweb-setup.md" ]; then ((PASSED_CHECKS++)); fi

((TOTAL_CHECKS++))
if [ -f ".opencode/commands/jasaweb-audit.md" ]; then ((PASSED_CHECKS++)); fi

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "Checks Passed: $PASSED_CHECKS/$TOTAL_CHECKS ($PERCENTAGE%)"

if [ $PERCENTAGE -ge 90 ]; then
    print_status 0 "Integration: EXCELLENT"
elif [ $PERCENTAGE -ge 75 ]; then
    print_status 0 "Integration: GOOD"
elif [ $PERCENTAGE -ge 50 ]; then
    print_warning "Integration: NEEDS IMPROVEMENT"
else
    print_status 1 "Integration: INCOMPLETE"
fi

echo ""
echo "🚀 Next Steps:"
echo "=============="
if [ "$AUTH_COUNT" -eq 0 ]; then
    echo "1. Set up Google OAuth: opencode auth login"
fi
echo "2. Test with available model: opencode run 'test' --model github-models/openai/gpt-4o-mini"
echo "3. Try JasaWeb agents after auth: opencode run 'test' --agent jasaweb-architect"
echo "4. Run architectural audit: @jasaweb-audit"
echo "5. Set up new project: @skill jasaweb-setup"

echo ""
echo "📖 For detailed usage, see: .opencode/README.md"