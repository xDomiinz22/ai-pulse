import type { Article } from '@prisma/client'
import prisma from './prisma'
import { redis } from './redis'

const TRENDING_KEY = 'trending'

// Most-voted / trending articles. Prefers the Redis sorted set (recency-weighted
// upvotes) and falls back to all-time top votes from Postgres. Shared by the
// /articles/trending route and the MCP get_trending tool.
export async function getTrendingArticles(limit = 5): Promise<Article[]> {
  const n = Math.min(20, Math.max(1, limit))

  if (redis) {
    try {
      const ids = await redis.zrange<string[]>(TRENDING_KEY, 0, n - 1, { rev: true })
      if (ids && ids.length > 0) {
        const numericIds = ids.map(Number).filter(Number.isInteger)
        const articles = await prisma.article.findMany({ where: { id: { in: numericIds } } })
        // Preserve the Redis ranking order.
        const byId = new Map(articles.map(a => [a.id, a]))
        return numericIds.map(id => byId.get(id)).filter((a): a is Article => Boolean(a))
      }
    } catch (err) {
      console.error('[trending] redis error, falling back:', (err as Error).message)
    }
  }

  return prisma.article.findMany({ orderBy: { votes_up: 'desc' }, take: n })
}

// Most recent articles, optionally filtered by category. Shared by the MCP
// list_recent tool.
export async function getRecentArticles(category?: string, limit = 10): Promise<Article[]> {
  const n = Math.min(50, Math.max(1, limit))
  const where = category && category !== 'all' ? { category } : {}
  return prisma.article.findMany({ where, orderBy: { published_at: 'desc' }, take: n })
}
