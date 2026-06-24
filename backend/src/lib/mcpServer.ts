import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { searchArticles } from './articleSearch'

// ── MCP server factory ──────────────────────────────────────────────────────
// Builds an MCP server that exposes our "search_articles" tool to any MCP
// client (Claude Desktop, Cursor, etc.). We create a FRESH server per request
// (see routes/mcp.ts) so the HTTP transport can be stateless.
//
// The flow when a client uses us:
//   client → "initialize"  (handshake: capabilities + protocol version)
//   client → "tools/list"  (we answer with search_articles + its schema)
//   client → "tools/call"  (we run searchArticles and return the results)

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'ai-pulse',
    version: '1.0.0',
  })

  server.registerTool(
    'search_articles',
    {
      title: 'Search AI Pulse news',
      description:
        'Search the AI Pulse news database for articles relevant to a topic or question. ' +
        'Returns the most semantically similar AI news articles with title, summary, category, source and URL.',
      // inputSchema is a Zod raw shape; the SDK turns it into the JSON Schema
      // that clients see in tools/list and validates arguments against.
      inputSchema: {
        query: z
          .string()
          .min(1)
          .max(200)
          .describe('A short search query, e.g. "OpenAI acquisitions" or "EU AI regulation".'),
      },
    },
    // The handler: WE execute the tool and return the result to the client.
    async ({ query }) => {
      const articles = await searchArticles(query, 5)

      if (articles.length === 0) {
        return {
          content: [{ type: 'text', text: `No articles found for "${query}".` }],
        }
      }

      const text = articles
        .map(
          (a, i) =>
            `${i + 1}. [${a.category}] ${a.title}\n` +
            `   ${a.short_summary ?? '(no summary)'}\n` +
            `   Source: ${a.source ?? 'unknown'} — ${a.url}`,
        )
        .join('\n\n')

      return {
        content: [{ type: 'text', text }],
      }
    },
  )

  return server
}
