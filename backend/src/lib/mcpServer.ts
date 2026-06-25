import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { searchArticles, getRelatedArticles } from './articleSearch'
import { getTrendingArticles, getRecentArticles } from './articleQueries'

// ── MCP server factory ──────────────────────────────────────────────────────
// Builds an MCP server exposing the AI Pulse news tools to any MCP client
// (Claude Desktop, Cursor, OpenAI agents, etc.). A FRESH server is created per
// request (see routes/mcp.ts) so the HTTP transport can be stateless.

// Minimal shape shared by every article-returning source (search, trending,
// recent). Both FoundArticle and the Prisma Article model satisfy it.
interface ArticleLike {
  title: string
  short_summary: string | null
  category: string
  source: string | null
  url: string
}

// Renders a list of articles as a single text block — the universally
// compatible MCP content type that any client/model can consume.
function articlesToContent(articles: ArticleLike[], emptyMessage: string) {
  if (articles.length === 0) {
    return { content: [{ type: 'text' as const, text: emptyMessage }] }
  }
  const text = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.category}] ${a.title}\n` +
        `   ${a.short_summary ?? '(no summary)'}\n` +
        `   Source: ${a.source ?? 'unknown'} — ${a.url}`,
    )
    .join('\n\n')
  return { content: [{ type: 'text' as const, text }] }
}

const CATEGORY = z.enum(['model', 'research', 'industry', 'ethics'])

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'ai-pulse', version: '1.1.0' })

  // ── Tool 1: semantic search (embeds the query → pgvector) ──
  server.registerTool(
    'search_articles',
    {
      title: 'Search AI Pulse news',
      description:
        'Search the AI Pulse news database for articles relevant to a topic or question. ' +
        'Returns the most semantically similar AI news articles with title, summary, category, source and URL.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .max(200)
          .describe('A short search query, e.g. "OpenAI acquisitions" or "EU AI regulation".'),
      },
    },
    async ({ query }) => {
      const articles = await searchArticles(query, 5)
      return articlesToContent(articles, `No articles found for "${query}".`)
    },
  )

  // ── Tool 2: trending (most-voted; no embedding cost) ──
  server.registerTool(
    'get_trending',
    {
      title: 'Get trending AI news',
      description:
        'Return the AI news articles that are currently trending (most up-voted by readers). ' +
        'Use this to answer "what is hot in AI right now".',
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('How many trending articles to return (default 5, max 20).'),
      },
    },
    async ({ limit }) => {
      const articles = await getTrendingArticles(limit ?? 5)
      return articlesToContent(articles, 'No trending articles yet.')
    },
  )

  // ── Tool 3: most recent, optionally by category (no embedding cost) ──
  server.registerTool(
    'list_recent',
    {
      title: 'List recent AI news',
      description:
        'List the most recently published AI news articles, optionally filtered by category. ' +
        'Use this to browse the latest news rather than searching by topic.',
      inputSchema: {
        category: CATEGORY.optional().describe(
          'Optional category filter: model, research, industry or ethics.',
        ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('How many articles to return (default 10, max 50).'),
      },
    },
    async ({ category, limit }) => {
      const articles = await getRecentArticles(category, limit ?? 10)
      const where = category ? ` in category "${category}"` : ''
      return articlesToContent(articles, `No recent articles${where}.`)
    },
  )

  // ── Tool 4: related articles (uses the source article's stored embedding) ──
  server.registerTool(
    'get_related',
    {
      title: 'Get related AI news',
      description:
        'Given the URL of an article (e.g. one returned by another tool), return other ' +
        'articles that are semantically related to it. Useful for "show me more like this".',
      inputSchema: {
        url: z
          .string()
          .url()
          .describe('The exact URL of an article already in the AI Pulse database.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('How many related articles to return (default 5, max 20).'),
      },
    },
    async ({ url, limit }) => {
      const articles = await getRelatedArticles(url, limit ?? 5)
      return articlesToContent(
        articles,
        `No related articles found for ${url}. The URL may not be in the database.`,
      )
    },
  )

  return server
}
