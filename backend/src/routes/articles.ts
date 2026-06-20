import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { redis } from '../lib/redis'
import { cached, articlesVersion, bumpArticlesVersion } from '../lib/cache'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

const LIST_TTL = 300   // seconds
const TRENDING_KEY = 'trending'
const TRENDING_TTL = 7 * 24 * 60 * 60 // 7 days

// GET /api/articles — lista con filtro por categoría y búsqueda (cacheada)
router.get('/', async (req: Request, res: Response) => {
  const { category, q, page = '1', limit = '20' } = req.query as Record<string, string>

  // Clamp pagination to safe bounds — prevents resource-exhaustion via huge
  // `limit` values or negative offsets.
  const pageNum  = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const skip     = (pageNum - 1) * limitNum

  const version  = await articlesVersion()
  const cacheKey = `articles:list:v${version}:${category || 'all'}:${q || ''}:${pageNum}:${limitNum}`

  const payload = await cached(cacheKey, LIST_TTL, async () => {
    const where: Record<string, unknown> = {}
    if (category && category !== 'all') where.category = category
    if (q) {
      where.OR = [
        { title:         { contains: q, mode: 'insensitive' } },
        { short_summary: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({ where, orderBy: { published_at: 'desc' }, skip, take: limitNum }),
      prisma.article.count({ where }),
    ])

    return { data: articles, total, page: pageNum, limit: limitNum }
  })

  res.json(payload)
})

// GET /api/articles/category-counts — número real de artículos por categoría (cacheada).
// Debe declararse antes de "/:id" para que no lo capture como un id.
router.get('/category-counts', async (_req: Request, res: Response) => {
  const version = await articlesVersion()

  const payload = await cached(`articles:counts:v${version}`, LIST_TTL, async () => {
    const grouped = await prisma.article.groupBy({ by: ['category'], _count: { _all: true } })

    const counts: Record<string, number> = { model: 0, research: 0, industry: 0, ethics: 0 }
    let all = 0
    for (const g of grouped) {
      const n = g._count._all
      if (g.category in counts) counts[g.category] = n
      all += n
    }
    return { all, ...counts }
  })

  res.json(payload)
})

// GET /api/articles/trending — artículos más votados.
// Usa un sorted set de Redis; si no hay datos en Redis cae a Postgres por votes_up.
router.get('/trending', async (req: Request, res: Response) => {
  const limitNum = Math.min(20, Math.max(1, parseInt(String(req.query.limit)) || 5))

  if (redis) {
    try {
      const ids = await redis.zrange<string[]>(TRENDING_KEY, 0, limitNum - 1, { rev: true })
      if (ids && ids.length > 0) {
        const numericIds = ids.map(Number).filter(Number.isInteger)
        const articles = await prisma.article.findMany({ where: { id: { in: numericIds } } })
        // Preserve the Redis ranking order.
        const byId = new Map(articles.map(a => [a.id, a]))
        const ordered = numericIds.map(id => byId.get(id)).filter(Boolean)
        res.json({ data: ordered, source: 'redis' })
        return
      }
    } catch (err) {
      console.error('[trending] redis error, falling back:', (err as Error).message)
    }
  }

  // Fallback: most up-voted articles straight from Postgres.
  const articles = await prisma.article.findMany({
    orderBy: { votes_up: 'desc' },
    take: limitNum,
  })
  res.json({ data: articles, source: 'postgres' })
})

// Parse and validate a numeric :id route param. Returns null if invalid.
function parseId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string') return null
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

// GET /api/articles/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: 'ID inválido' }); return }

  const article = await prisma.article.findUnique({ where: { id } })
  if (!article) { res.status(404).json({ error: 'Artículo no encontrado' }); return }
  res.json(article)
})

// POST /api/articles/:id/vote — voto positivo o negativo
router.post('/:id/vote', async (req: Request, res: Response) => {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: 'ID inválido' }); return }

  const { type } = req.body as { type: 'up' | 'down' }
  if (type !== 'up' && type !== 'down') {
    res.status(400).json({ error: 'type debe ser "up" o "down"' })
    return
  }

  const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } })
  if (!exists) { res.status(404).json({ error: 'Artículo no encontrado' }); return }

  // Anti-spam: one vote per IP per article per 24h (only when Redis is on).
  if (redis) {
    try {
      const voteKey = `vote:${id}:${req.ip || 'anon'}`
      const fresh = await redis.set(voteKey, 1, { nx: true, ex: 24 * 60 * 60 })
      if (fresh === null) {
        res.status(429).json({ error: 'Ya has votado este artículo' })
        return
      }
    } catch (err) {
      console.error('[vote] redis error, allowing vote:', (err as Error).message)
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data: type === 'up' ? { votes_up: { increment: 1 } } : { votes_down: { increment: 1 } },
    select: { id: true, votes_up: true, votes_down: true },
  })

  // Track upvotes in the trending sorted set.
  if (redis && type === 'up') {
    try {
      await redis.zincrby(TRENDING_KEY, 1, String(id))
      await redis.expire(TRENDING_KEY, TRENDING_TTL)
    } catch (err) {
      console.error('[vote] trending error:', (err as Error).message)
    }
  }

  await bumpArticlesVersion()  // vote counts changed → invalidate cached lists
  res.json(article)
})

// POST /api/articles — crear artículo (solo admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { title, url, short_summary, source, category, image_url, read_time, published_at } = req.body

  if (!title || !url || !category) {
    res.status(400).json({ error: 'title, url y category son obligatorios' })
    return
  }

  const article = await prisma.article.create({
    data: { title, url, short_summary, source, category, image_url, read_time, published_at: published_at ? new Date(published_at) : null },
  })

  await bumpArticlesVersion()  // invalidate cached lists/counts
  res.status(201).json(article)
})

// DELETE /api/articles/:id (solo admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: 'ID inválido' }); return }

  const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } })
  if (!exists) { res.status(404).json({ error: 'Artículo no encontrado' }); return }

  await prisma.article.delete({ where: { id } })
  if (redis) { try { await redis.zrem(TRENDING_KEY, String(id)) } catch { /* noop */ } }
  await bumpArticlesVersion()
  res.status(204).send()
})

export default router
