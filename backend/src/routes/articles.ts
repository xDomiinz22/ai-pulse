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
      { title:   { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ]
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { published_at: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.article.count({ where }),
  ])

  res.json({ data: articles, total, page: parseInt(page), limit: parseInt(limit) })
})

// GET /api/articles/:id
router.get('/:id', async (req: Request, res: Response) => {
  const article = await prisma.article.findUnique({ where: { id: Number(req.params.id) } })
  if (!article) { res.status(404).json({ error: 'Artículo no encontrado' }); return }
  res.json(article)
})

// POST /api/articles/:id/vote — voto positivo o negativo
router.post('/:id/vote', async (req: Request, res: Response) => {
  const { type } = req.body as { type: 'up' | 'down' }
  if (type !== 'up' && type !== 'down') {
    res.status(400).json({ error: 'type debe ser "up" o "down"' })
    return
  }

  const article = await prisma.article.update({
    where: { id: Number(req.params.id) },
    data: type === 'up' ? { votes_up: { increment: 1 } } : { votes_down: { increment: 1 } },
    select: { id: true, votes_up: true, votes_down: true },
  })

  res.json(article)
})

// POST /api/articles — crear artículo (solo admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { title, url, excerpt, source, category, image_url, read_time, published_at } = req.body

  if (!title || !url || !category) {
    res.status(400).json({ error: 'title, url y category son obligatorios' })
    return
  }

  const article = await prisma.article.create({
    data: { title, url, excerpt, source, category, image_url, read_time, published_at: published_at ? new Date(published_at) : null },
  })

  res.status(201).json(article)
})

// DELETE /api/articles/:id (solo admin)
router.delete('/:id', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  await prisma.article.delete({ where: { id: Number(_req.params.id) } })
  res.status(204).send()
})

export default router
