---
name: skill-builder
description: Create new OpenCode Skills with proper YAML frontmatter, progressive disclosure structure, and complete directory organization. Use when you need to build custom skills for specific workflows, generate skill templates, or understand the OpenCode Skills specification.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: skill-development
  category: development-tools
---

## What I do
- Guide creation of OpenCode skills with proper format
- Generate skill templates and directory structures
- Validate skill syntax and compliance
- Provide progressive disclosure architecture guidance
- Ensure skills follow OpenCode discovery patterns

## When to use me
Use when creating new OpenCode skills for specific workflows, generating skill templates, understanding OpenCode skill specifications, or ensuring proper skill format compliance.

## Quick Start

### Creating Your First Skill
```bash
# 1. Create skill directory (MUST be in .opencode/skills/)
mkdir -p .opencode/skills/my-first-skill

# 2. Create SKILL.md with proper format
cat > .opencode/skills/my-first-skill/SKILL.md << 'EOF'
---
name: my-first-skill
description: Brief description of what this skill does and when OpenCode should use it. Maximum 1024 characters.
---

# My First Skill

## What I do
[Your instructions here]

## When to use me
[Usage instructions]
EOF

# 3. Verify skill with opencode
opencode skill list
```

## Skill Format Requirements

### 📋 YAML Frontmatter (REQUIRED)
Every SKILL.md **must** start with YAML frontmatter:

```yaml
---
name: skill-name                    # REQUIRED: 1-64 chars, lowercase, hyphens only
description: What this skill does and when to use it  # REQUIRED: 1-1024 chars
license: MIT                       # Optional
compatibility: opencode             # Optional
metadata:                          # Optional
  audience: developers
  category: development
---
```

### Naming Rules
**Name validation regex:** `^[a-z0-9]+(-[a-z0-9]+)*$`

**Valid names:**
- `git-release` ✅
- `api-endpoint` ✅
- `database-migration` ✅

**Invalid names:**
- `git_release` ❌ (underscores)
- `Git-Release` ❌ (uppercase)
- `--invalid` ❌ (consecutive hyphens)

### 📂 Directory Structure
```
.opencode/skills/
├── skill-name/
│   └── SKILL.md                     # MUST be exactly "SKILL.md"
├── another-skill/
│   └── SKILL.md
└── nested-skills/
    ├── api-endpoint/
    │   └── SKILL.md
    └── database-migration/
        └── SKILL.md
```

## Templates

### Basic Skill Template
```markdown
---
name: my-basic-skill
description: One sentence what. One sentence when to use.
---

## What I do
[2-3 sentences describing functionality]

## When to use me
[Clear usage instructions]

## Examples
[Specific usage examples]
```

### Advanced Skill Template
```markdown
---
name: my-advanced-skill
description: Detailed what with key features. When to use with specific triggers.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
  category: automation
---

## What I do
1. Primary function
2. Secondary function
3. Integration capability

## When to use me
- Specific trigger 1
- Specific trigger 2
- Specific trigger 3

## Examples
For typical usage:

```bash
# Example command
opencode run "task description" --skill my-advanced-skill
```

## Configuration
Edit config if needed:
```json
{
  "option1": "value1",
  "option2": "value2"
}
```
```

## Validation Checklist

Before completing a skill, verify:

**Frontmatter:**
- [ ] Starts with `---`
- [ ] Contains `name` field (1-64 chars, valid format)
- [ ] Contains `description` field (1-1024 chars)
- [ ] Ends with `---`
- [ ] No YAML syntax errors

**File Structure:**
- [ ] Directory named exactly like `name` field
- [ ] SKILL.md exists (exact case)
- [ ] Located in `.opencode/skills/[name]/SKILL.md`

**Content:**
- [ ] Clear "What I do" section
- [ ] Clear "When to use me" section
- [ ] Practical examples
- [ ] Proper OpenCode integration

## Integration with JasaWeb

When creating skills for JasaWeb:

1. **Follow AGENTS.md standards**: Ensure skills comply with architectural guidelines
2. **Maintain 99.8/100 score**: Generated code must maintain architectural excellence
3. **Security compliance**: Maintain 100/100 security score
4. **Testing inclusion**: Include test generation/verification
5. **Documentation standards**: Include comprehensive examples

## Common Mistakes to Avoid

- ❌ Using underscores in skill names
- ❌ Using uppercase letters in skill names
- ❌ Creating skill files directly in skills/ directory
- ❌ Missing closing `---` in frontmatter
- ❌ Name field not matching directory name
- ❌ Description without "when to use" component

## Verification Commands

```bash
# List available skills
opencode skill list

# Test specific skill
opencode run "test skill functionality" --skill my-skill

# Check skill format
opencode skill validate my-skill
```

This skill ensures proper OpenCode skill creation while maintaining JasaWeb's worldclass development standards.