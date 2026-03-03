# Spaced English MCP Server

Exposes your learning data via [Model Context Protocol](https://modelcontextprotocol.io/) (MCP), so Claude Code can query your progress directly.

## Resources

| URI | Description |
|-----|-------------|
| `learning://collocations` | All collocations with status and mastery |
| `learning://users/{id}/progress` | User progress summary |

## Tools

| Tool | Description |
|------|-------------|
| `get_due_cards` | Flashcards due for review today |
| `get_learning_stats` | Overall learning statistics |
| `add_collocation` | Add a new collocation |

## Setup

Add to your Claude Code config (`~/.claude.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "spaced-english": {
      "command": "npx",
      "args": ["tsx", "mcp-server/index.ts"],
      "cwd": "/path/to/spaced-english",
      "env": {
        "POSTGRES_URL": "postgresql://spaced:spaced_dev@localhost:5432/spaced_english"
      }
    }
  }
}
```

## Running standalone

```bash
pnpm mcp:start
```

Transport: stdio (standard in/out JSON-RPC).
