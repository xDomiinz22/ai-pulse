import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/articles — lista con filtro por categoría y búsqueda
router.get('/', async (req: Request, res: Response) => {
  const { category, q, page = '1', limit = '20' } = req.query as Record<string, string>

  const where: Record<string, unknown> = {}
  if (category && category !== 'all') where.category = category
  if (q) {
    where.OR = [
      { title:         { contains: q, mode: 'insensitive' } },
      { short_summary: { contains: q, mode: 'insensitive' } },
    ]
  }

  // Clamp pagination to safe bounds — prevents resource-exhaustion via huge
  // `limit` values or negative offsets.
  const pageNum  = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const skip     = (pageNum - 1) * limitNum

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { published_at: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.article.count({ where }),
  ])

  res.json({ data: articles, total, page: pageNum, limit: limitNum })
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

  const article = await prisma.article.update({
    where: { id },
    data: type === 'up' ? { votes_up: { increment: 1 } } : { votes_down: { increment: 1 } },
    select: { id: true, votes_up: true, votes_down: true },
  })

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

  res.status(201).json(article)
})

// DELETE /api/articles/:id (solo admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: 'ID inválido' }); return }

  const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } })
  if (!exists) { res.status(404).json({ error: 'Artículo no encontrado' }); return }

  await prisma.article.delete({ where: { id } })
  res.status(204).send()
})

export default router
