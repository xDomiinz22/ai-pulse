import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import prisma from '../lib/prisma'

const router = Router()

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email inválido' })
    return
  }

  const exists = await prisma.newsletterSubscription.findUnique({ where: { email } })
  if (exists?.verified) {
    res.json({ message: 'Este email ya está suscrito' })
    return
  }

  // Generamos token para verificación (guardado hasheado no es necesario aquí
  // porque es un enlace de baja importancia, pero sí usamos random)
  const token = crypto.randomBytes(32).toString('hex')

  await prisma.newsletterSubscription.upsert({
    where:  { email },
    update: {},
    create: { email },
  })

  // TODO: enviar email de confirmación con token
  res.status(201).json({ message: 'Suscripción registrada. Confirma tu email.' })
})

// GET /api/newsletter/unsubscribe?email=x
router.get('/unsubscribe', async (req: Request, res: Response) => {
  const { email } = req.query as { email: string }
  await prisma.newsletterSubscription.deleteMany({ where: { email } })
  res.json({ message: 'Suscripción cancelada correctamente' })
})

export default router
