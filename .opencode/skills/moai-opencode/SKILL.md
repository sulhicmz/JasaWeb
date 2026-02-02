---
name: moai-opencode
description: OpenCode.ai comprehensive reference documentation for configuration, customization, and troubleshooting. Use when working with OpenCode TUI, CLI, IDE integration, configuring agents, tools, MCP servers, creating plugins, or developing with the SDK.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: opencode-development
  category: development-tools
---

## What I do
- Provide comprehensive OpenCode.ai reference documentation
- Guide configuration and customization of OpenCode environments
- Support IDE integration and plugin development
- Assist with MCP server setup and tool development
- Enable SDK integration and custom workflow creation

## When to use me
Use when working with OpenCode TUI, CLI commands, IDE integration, agent configuration, tool development, MCP server setup, plugin creation, or SDK development.

## OpenCode.ai Comprehensive Documentation

### Quick Reference
**Installation:**
```bash
curl -fsSL https://opencode.ai/install | bash
npm install -g opencode
```

**Essential Commands:**
```bash
opencode              # Launch TUI
opencode run "prompt"  # Non-interactive mode
opencode --version    # Check version
```

**Core Features:**
- Terminal User Interface (TUI)
- Command Line Interface (CLI)
- IDE Integration (VS Code, Cursor)
- Agent System with specialized subagents
- Tool System with extensibility
- MCP Server Integration
- Plugin Architecture
- SDK for custom development

### Configuration Architecture

#### Configuration Hierarchy
```yaml
Priority:
  1. Command-line flags (highest)
  2. Environment variables
  3. Project config (./opencode.json)
  4. Global config (~/.config/opencode/opencode.json)
  5. Built-in defaults (lowest)
```

#### Configuration Structure
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["plugin-name@version"],
  "model": "provider/model-id",
  "provider": {
    "provider-id": {
      "options": {},
      "models": {}
    }
  },
  "agent": {
    "agent-name": {
      "description": "Agent description",
      "model": "provider/model",
      "tools": {},
      "skills": []
    }
  },
  "tools": {},
  "mcp": {},
  "permission": {}
}
```

### Agent System

#### Primary Agents
- **Build**: Full tools enabled (default)
- **Plan**: Restricted, analysis-focused

#### Subagents
- **General**: Research and multi-step tasks
- **Explore**: Fast codebase exploration
- **Oracle**: Architecture and debugging
- **Librarian**: Documentation and code search
- **Frontend UI/UX Engineer**: UI development
- **Document Writer**: Documentation generation

#### Agent Configuration
```json
{
  "agent": {
    "jasaweb-architect": {
      "description": "JasaWeb architectural specialist",
      "mode": "subagent",
      "model": "google/antigravity-claude-sonnet-4-5-thinking",
      "temperature": 0.2,
      "tools": {"write": true, "edit": true, "bash": true, "read": true},
      "skills": ["skill-builder", "moai-opencode"]
    }
  }
}
```

### Tool System

#### Built-in Tools
- **Read**: File content reading
- **Write**: File creation/modification
- **Edit**: In-place file editing
- **Bash**: Command execution
- **Grep**: Content search
- **Glob**: File pattern matching
- **LSP**: Language Server Protocol integration

#### Tool Permissions
```yaml
Levels:
  allow: Auto-approve execution
  ask: Request user approval
  deny: Block execution
```

#### Custom Tool Development
```javascript
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Tool description",
  args: {
    param1: tool.schema.string().describe("Parameter description")
  },
  async execute(args) {
    return "Tool result";
  }
});
```

### Model Context Protocol (MCP)

#### MCP Server Configuration
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem"],
      "args": ["/path/to/files"]
    }
  }
}
```

#### Popular MCP Servers
- **GitHub**: Repository management and code search
- **Filesystem**: Local file system access
- **Database**: Database querying and management
- **Web Search**: Internet search capabilities
- **Memory**: Persistent memory systems

### Plugin Development

#### Plugin Structure
```
my-plugin/
├── package.json
├── src/
│   ├── index.js
│   ├── agent.js
│   ├── skill.js
│   └── tool.js
└── README.md
```

#### Plugin Configuration
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "main": "src/index.js",
  "opencode": {
    "agents": ["src/agent.js"],
    "skills": ["src/skill.js"],
    "tools": ["src/tool.js"]
  }
}
```

### IDE Integration

#### VS Code/Cursor Integration
**Keyboard Shortcuts:**
- `Cmd+Esc` (macOS) / `Ctrl+Esc` (Windows/Linux): Quick launch
- `Cmd+Shift+Esc` / `Ctrl+Shift+Esc`: New session
- `Cmd+Option+K` / `Alt+Ctrl+K`: Insert file reference

**Setup:**
1. Install OpenCode extension
2. Run `opencode` in integrated terminal
3. Use keyboard shortcuts for quick access

#### File References
```typescript
// Reference syntax
@src/main.ts              // File reference
@src/main.ts#L37-42       // Line range reference
@folder/                  // Directory reference
```

### Advanced Configuration

#### Provider Setup
```json
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}",
        "baseURL": "https://api.anthropic.com"
      }
    },
    "google": {
      "npm": "@ai-sdk/google",
      "options": {
        "project": "{env:GOOGLE_CLOUD_PROJECT}"
      }
    }
  }
}
```

#### Model Variants
```json
{
  "models": {
    "claude-sonnet-4-5-thinking": {
      "variants": {
        "low": {
          "thinkingConfig": {
            "thinkingBudget": 8192
          }
        },
        "max": {
          "thinkingConfig": {
            "thinkingBudget": 32768
          }
        }
      }
    }
  }
}
```

#### Custom Commands
```json
{
  "command": {
    "test": {
      "description": "Run test suite",
      "command": "npm test"
    },
    "lint": {
      "description": "Run linter",
      "command": "npm run lint"
    }
  }
}
```

### Enterprise Features

#### Central Configuration
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@company/opencode-enterprise"],
  "enterprise": {
    "sso": {
      "provider": "okta",
      "domain": "company.okta.com"
    },
    "ai_gateway": {
      "url": "https://ai-gateway.company.com"
    }
  }
}
```

#### Security Configuration
```json
{
  "permission": {
    "write": "ask",
    "bash": "allow",
    "network": "deny"
  },
  "security": {
    "allowed_paths": ["/workspace/project"],
    "blocked_commands": ["rm -rf", "sudo"]
  }
}
```

### Troubleshooting

#### Common Issues
1. **Plugin Loading Errors**
   ```bash
   # Clear cache
   rm -rf ~/.cache/opencode
   # Reinstall plugins
   npm install -g oh-my-opencode@latest
   ```

2. **Authentication Problems**
   ```bash
   # Clear auth
   rm ~/.config/opencode/auth.json
   # Re-authenticate
   opencode auth login
   ```

3. **Performance Issues**
   ```bash
   # Check logs
   tail -f ~/.local/share/opencode/log/latest.log
   # Monitor resources
   opencode --log-level DEBUG
   ```

#### Debug Mode
```bash
# Enable debug logging
opencode --log-level DEBUG

# Print logs to stdout
opencode --print-logs

# Check configuration
opencode --config-check
```

### Best Practices

#### Performance Optimization
- Use appropriate models for tasks
- Limit context window usage
- Enable caching for repeated operations
- Use background tasks for parallel processing

#### Security Guidelines
- Use environment variables for secrets
- Implement proper permission controls
- Regularly update dependencies
- Monitor access logs

#### Development Workflow
1. Start with basic configuration
2. Add specialized agents for complex tasks
3. Integrate custom tools for repetitive operations
4. Set up MCP servers for external integrations
5. Configure IDE integration for seamless workflow

### Integration with JasaWeb

When using this skill for JasaWeb development:

1. **Maintain Architectural Standards**: Follow AGENTS.md guidelines
2. **Security Compliance**: Maintain 100/100 security score
3. **Performance Optimization**: Keep sub-2ms query targets
4. **Testing Requirements**: Ensure 464-test baseline coverage
5. **Documentation Standards**: Include comprehensive examples

### Resources

- **Official Documentation**: https://opencode.ai/docs
- **GitHub Repository**: https://github.com/anomalyco/opencode
- **Community Discord**: https://opencode.ai/discord
- **Plugin Registry**: https://registry.opencode.ai
- **MCP Server List**: https://modelcontextprotocol.io/servers

This skill provides comprehensive OpenCode.ai documentation while maintaining JasaWeb's worldclass development standards.