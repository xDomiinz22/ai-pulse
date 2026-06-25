# Install the AI Pulse MCP server

> **Instructions for an AI agent (Claude Code, Cursor, Cline, etc.):**
> Your task is to connect this environment to the **AI Pulse** MCP server so the
> user can search an AI-news database from their model. Follow the steps below
> for the environment you are running in, then run the verification step.

## What this server does

AI Pulse exposes three tools over the Model Context Protocol (Streamable HTTP),
all returning AI-news articles (title, summary, category, source, URL):

- **`search_articles`** — semantic search by topic or question.
- **`get_trending`** — the most up-voted / currently trending articles.
- **`list_recent`** — the latest articles, optionally filtered by category
  (`model` / `research` / `industry` / `ethics`).

MCP is model-agnostic — it works with Claude, OpenAI/GPT, and any MCP client.

## Endpoint (the only value you need)

```
https://ai-pulse-newsletter.vercel.app/api/mcp
```

- Transport: **Streamable HTTP**, stateless.
- Auth: **none** (public, read-only).
- Requirement on the user's machine: **Node.js** (only if the stdio bridge is used).

---

## Installation — pick the block that matches your environment

### Claude Code (CLI)

Run:

```bash
claude mcp add --transport http ai-pulse https://ai-pulse-newsletter.vercel.app/api/mcp
```

### Cursor / VS Code / Cline (native HTTP MCP)

Add this to the MCP config (`.cursor/mcp.json`, VS Code `settings.json` →
`mcp.servers`, or the client's MCP settings file):

```json
{
  "mcpServers": {
    "ai-pulse": {
      "url": "https://ai-pulse-newsletter.vercel.app/api/mcp"
    }
  }
}
```

### Claude Desktop (and any stdio-only client) — `mcp-remote` bridge

Edit the config file:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Merge in:

```json
{
  "mcpServers": {
    "ai-pulse": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://ai-pulse-newsletter.vercel.app/api/mcp"]
    }
  }
}
```

Then fully restart the client (quit from the system tray/menu bar, not just the
window).

### Claude.ai (Custom Connectors)

In **Settings → Connectors → Add custom connector**, paste the endpoint URL
directly. No bridge needed.

### OpenAI — Responses API (point the API at the URL)

```python
from openai import OpenAI
client = OpenAI()

resp = client.responses.create(
    model="gpt-5",
    input="Find recent news about OpenAI",
    tools=[{
        "type": "mcp",
        "server_label": "ai-pulse",
        "server_url": "https://ai-pulse-newsletter.vercel.app/api/mcp",
        "require_approval": "never",
    }],
)
print(resp.output_text)
```

### OpenAI — Agents SDK (Python)

```python
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async with MCPServerStreamableHttp(
    params={"url": "https://ai-pulse-newsletter.vercel.app/api/mcp"}
) as server:
    agent = Agent(name="news", model="gpt-5", mcp_servers=[server])
    result = await Runner.run(agent, "What has OpenAI been doing recently?")
    print(result.final_output)
```

---

## Verify the connection

After configuring, confirm the tool is available and works:

- **Claude Code:** run `claude mcp list` — `ai-pulse` should appear as connected.
- **Any client:** start a new conversation and ask:
  > "Use the ai-pulse tool to search for news about EU AI regulation."

  The agent should call `search_articles` and answer with cited articles.

If the tool does not appear, ensure the client was fully restarted and that
Node.js is installed (needed for `npx`/`mcp-remote`).
