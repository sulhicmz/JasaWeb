---
name: opencode-reference
description: OpenCode.ai comprehensive reference documentation covering installation, configuration, TUI usage, CLI commands, IDE integration, and custom tool development. Use when working with OpenCode TUI, CLI, agent configuration, MCP servers, plugin development, or SDK integration.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: opencode-usage
  category: documentation
---

## What I do
- Provide comprehensive OpenCode.ai reference
- Guide installation and configuration
- Explain TUI and CLI usage patterns
- Assist with custom agent and tool development
- Support MCP server integration
- Enable JasaWeb-specific OpenCode workflows

## When to use me
Use when working with OpenCode TUI, CLI commands, IDE integration, configuring agents, creating tools, setting up MCP servers, plugin development, or troubleshooting OpenCode issues in JasaWeb environment.

## Quick Reference

### Installation
```bash
# Quick install
curl -fsSL https://opencode.ai/install | bash

# Package managers
npm install -g opencode
brew install opencode
pnpm install -g opencode
```

### Basic Usage
```bash
# Launch TUI
opencode

# Non-interactive
opencode run "prompt here"

# Headless server
opencode serve

# Web interface
opencode web
```

### Essential Commands
- `/connect` - Configure API keys
- `/init` - Generate AGENTS.md
- `/models` - List available models
- `/share` - Share session
- `/undo` - Undo changes
- `Tab` - Switch agents
- `Ctrl+P` - Command palette

## Configuration

### Configuration Files (priority order)
1. Command-line flags
2. Environment variables
3. Project: `./opencode.json`
4. Global: `~/.config/opencode/opencode.json`
5. Built-in defaults

### JasaWeb Project Configuration
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-opencode@latest", "opencode-antigravity-auth@latest"],
  "model": "google/antigravity-claude-sonnet-4-5-thinking",
  "provider": {
    "google": {
      "npm": "@ai-sdk/google",
      "models": {
        "antigravity-claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5 (Antigravity)",
          "limit": {"context": 200000, "output": 64000}
        }
      }
    }
  },
  "agent": {
    "jasaweb-architect": {
      "description": "JasaWeb architectural specialist ensuring 99.8/100 score compliance",
      "mode": "subagent",
      "model": "google/antigravity-claude-sonnet-4-5-thinking"
    }
  },
  "instructions": ["AGENTS.md", ".opencode/*.md"]
}
```

### Agent Configuration
```json
{
  "agent": {
    "jasaweb-developer": {
      "description": "JasaWeb development specialist following AGENTS.md rules",
      "mode": "subagent",
      "model": "google/antigravity-gemini-3-pro",
      "temperature": 0.2,
      "tools": {
        "write": true,
        "edit": true,
        "bash": true,
        "read": true
      }
    }
  }
}
```

## TUI Usage

### File References
```bash
# Reference files with @ syntax
@src/main.ts What does this file do?
@src/pages/api/auth.ts Handle authentication here
```

### Bash Commands
```bash
# Execute shell commands with !
!npm test
!pnpm lint
!git status
```

### Slash Commands

| Command | Description | Keybind |
|---------|-------------|---------|
| `/connect` | Configure API keys | - |
| `/init` | Generate AGENTS.md | `ctrl+x i` |
| `/models` | List available models | `ctrl+x m` |
| `/share` | Share current session | `ctrl+x s` |
| `/undo` | Undo last change | `ctrl+x u` |
| `/help` | Show help dialog | `ctrl+x h` |
| `/new` | Start new session | `ctrl+x n` |
| `/exit` | Exit OpenCode | `ctrl+x q` |

## Providers Setup

### Antigravity (Google)
```bash
# Authenticate
opencode
/connect
# Select "opencode"
# Visit opencode.ai/auth
# Enter API key
```

### Custom Provider
```json
{
  "provider": {
    "my-provider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My Custom Provider",
      "options": {
        "baseURL": "https://api.myprovider.com/v1",
        "apiKey": "{env:MY_API_KEY}"
      }
    }
  }
}
```

## Skills and Commands

### Using Skills
```bash
# Use skill in conversation
opencode run "Create a new skill using skill-builder"

# Skill via command
/skill skill-builder
```

### Custom Commands
Create `.opencode/commands/my-command.md`:
```markdown
---
description: Review current PR changes
agent: jasaweb-architect
---

Review the following changes:
!`git diff --staged`

Check for:
- Architectural compliance (99.8/100 score)
- Security standards (100/100 score)
- Performance impact
- Test coverage
```

## Agent Development

### Custom Agent Structure
`.opencode/agents/my-agent.md`:
```markdown
---
description: My specialized agent
mode: subagent
model: google/antigravity-claude-sonnet-4-5
temperature: 0.2
tools:
  write: true
  edit: true
  bash: true
  read: true
---

You are my specialized agent with specific capabilities...

## Core Responsibilities
- [List responsibilities]
- [Integration patterns]
- [Quality standards]
```

### JasaWeb Agent Integration
Agents work together:
- **jasaweb-architect**: Ensures 99.8/100 architectural score
- **jasaweb-developer**: Implements following AGENTS.md rules
- **jasaweb-security**: Maintains 100/100 security score
- **jasaweb-tester**: Ensures 464-test baseline
- **jasaweb-autonomous**: Self-heal, self-learn, self-evolve

## MCP Servers

### Setting up GitHub MCP
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### Using MCP Servers
```bash
# List available servers
opencode mcp list

# Add new server
opencode mcp add server-name

# Authenticate server
opencode mcp auth server-name
```

## Custom Tools

### Tool Structure
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query JasaWeb database",
  args: {
    query: tool.schema.string().describe("SQL query")
  },
  async execute(args) {
    // Implementation
    return `Executed: ${args.query}`
  }
})
```

### Tool Registration
Add to `opencode.json`:
```json
{
  "tools": {
    "jasaweb-db": {
      "type": "local",
      "command": ["node", "tools/db-tool.js"]
    }
  }
}
```

## JasaWeb Workflow Examples

### 1. Architectural Review
```bash
opencode
/jasaweb-architect Review this new feature for architectural compliance
```

### 2. Implementation with Standards
```bash
/jasaweb-developer Implement user authentication following AGENTS.md rules
```

### 3. Security Validation
```bash
/jasaweb-security Validate this payment integration for security issues
```

### 4. Test Creation
```bash
/jasaweb-tester Create comprehensive tests for this new service
```

### 5. Autonomous Maintenance
```bash
/jasaweb-autonomous Heal the failing tests and evolve the system
```

## IDE Integration

### VS Code/Cursor Integration
- Automatic installation when running opencode in integrated terminal
- Keyboard shortcuts:
  - `Cmd+Esc` (macOS) / `Ctrl+Esc` (Windows/Linux) - Quick launch
  - `Cmd+Option+K` (macOS) / `Alt+Ctrl+K` (Windows/Linux) - Insert file reference

## Session Management

### Sessions
```bash
# List sessions
opencode session list

# Share current session
/share

# Export session
opencode session export <session-id>

# Import session
opencode session import <file>
```

### Collaboration
- Share sessions with team members
- Maintain context across development sessions
- Preserve architectural decisions and reasoning

## Development Integration

### API Operations
```bash
# Start headless server
opencode serve --port 3000

# Use API in external tools
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Review this code"}'
```

### GitHub Actions Integration
```bash
# Install GitHub workflow
opencode github install

# Run in CI/CD
opencode github run --agent jasaweb-architect
```

## Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Check auth status
opencode auth list

# Re-authenticate
opencode auth login
```

#### Model Access Issues
```bash
# Check available models
opencode models

# Refresh model cache
opencode models --refresh
```

#### Configuration Issues
```bash
# Validate configuration
opencode config validate

# Check file locations
ls ~/.config/opencode/
ls ./opencode.json
```

### Logs and Debugging
```bash
# Enable debug logging
opencode --log-level DEBUG

# Print logs to stdout
opencode --print-logs

# Log locations
# macOS/Linux: ~/.local/share/opencode/log/
# Windows: %USERPROFILE%\.local\share\opencode\log\
```

## Performance Optimization

### Memory Management
```json
{
  "compaction": "auto",
  "watcher": {
    "ignore": ["node_modules", ".git", "dist"]
  }
}
```

### Bundle Optimization
```json
{
  "tools": {
    "write": true,
    "bash": "allow"
  },
  "permission": {
    "edit": "ask",
    "bash": "allow"
  }
}
```

## Resources

### Documentation
- **Official Docs**: https://opencode.ai/docs
- **GitHub**: https://github.com/anomalyco/opencode
- **Discord**: https://opencode.ai/discord

### Storage Locations
- **Config**: `~/.config/opencode/`
- **Data**: `~/.local/share/opencode/`
- **Cache**: `~/.cache/opencode/`
- **Logs**: `~/.local/share/opencode/log/`

This skill provides comprehensive OpenCode.ai support while maintaining integration with JasaWeb's high architectural standards and development workflows.