# CLI Agent Collection

Condensed AI coding agents optimized for CLI tools (Gemini CLI, Claude CLI, OpenCode CLI, etc).

## Architecture

```
User Input → [00 Strategist] → feature.md + task.md
                                    ↓
                             [01-11 Agents] execute
                                    ↓
                           [00 Strategist] review
```

## Usage

```bash
# Example with Gemini CLI
gemini --system-prompt "$(cat 00-strategist.md)" "new feature request"
gemini --system-prompt "$(cat 02-sanitizer.md)" "fix the build"

# Example with Claude CLI  
claude --system "$(cat 04-security.md)" "audit dependencies"
```

## Agents

| File | Agent | Focus |
|------|-------|-------|
| `00-strategist.md` | **Product Strategist** 🧠 | Planning, docs, direction |
| `01-architect.md` | Code Architect | System design, modularity |
| `02-sanitizer.md` | Code Sanitizer | Bug fix, lint, build |
| `03-test-engineer.md` | Test Engineer | Testing, coverage |
| `04-security.md` | Security Specialist | Vulnerabilities, deps |
| `05-performance.md` | Performance Optimizer | Speed, efficiency |
| `06-data-architect.md` | Data Architect | Database, queries |
| `07-integration.md` | Integration Engineer | APIs, 3rd party |
| `08-ui-ux.md` | UI/UX Engineer | Frontend, a11y |
| `09-devops.md` | DevOps Engineer | CI/CD, infrastructure |
| `10-tech-writer.md` | Technical Writer | Documentation |
| `11-code-reviewer.md` | Code Reviewer | Review, refactoring |

## Autonomous Workflow

```bash
# 1. Start with strategist for planning
gemini -s "$(cat 00-strategist.md)" "User wants dark mode"

# 2. Specialists execute assigned tasks
gemini -s "$(cat 08-ui-ux.md)" "Create dark mode toggle"
gemini -s "$(cat 02-sanitizer.md)" "Extract theme to config"
gemini -s "$(cat 03-test-engineer.md)" "Add dark mode tests"

# 3. Strategist reviews
gemini -s "$(cat 00-strategist.md)" "Review dark mode progress"
```

## Documents Managed

| Document | Purpose | Managed By |
|----------|---------|------------|
| `docs/blueprint.md` | Architecture & standards | 00 Strategist |
| `docs/task.md` | Task backlog | 00 Strategist |
| `docs/feature.md` | Feature specs | 00 Strategist |
| `docs/roadmap.md` | Strategic direction | 00 Strategist |

## Size

| Version | Size | For |
|---------|------|-----|
| Full (root/*.txt) | 7-15 KB | IDE, manual use |
| Condensed (cli/*.md) | 1.5-3 KB | CLI tools |
