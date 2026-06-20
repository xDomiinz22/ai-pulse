import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { config } from '../config'
import { redis } from '../lib/redis'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email y password son obligatorios' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    return
  }

  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
  if (exists) {
    res.status(409).json({ error: 'El email o username ya está en uso' })
    return
  }

  const password_hash       = await bcrypt.hash(password, 12)
  const verification_token  = crypto.randomBytes(32).toString('hex')

  const user = await prisma.user.create({
    data: { username, email, password_hash, verification_token },
    select: { id: true, username: true, email: true, role: true, email_verified: true },
  })

  // TODO: enviar email con verification_token
  res.status(201).json({ user, message: 'Cuenta creada. Verifica tu email para activarla.' })
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.is_active) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } })

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
      algorithm: config.jwtAlgorithm,
      jwtid: crypto.randomUUID(),  // unique id so the token can be revoked
    } as jwt.SignOptions,
  )

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  })
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body
  const user = await prisma.user.findUnique({ where: { verification_token: token } })
  if (!user) { res.status(400).json({ error: 'Token inválido' }); return }

  await prisma.user.update({
    where: { id: user.id },
    data: { email_verified: true, verification_token: null },
  })

  res.json({ message: 'Email verificado correctamente' })
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email } })

  // Respuesta genérica para no revelar si el email existe
  if (!user) { res.json({ message: 'Si el email existe recibirás un enlace de recuperación' }); return }

  const reset_token             = crypto.randomBytes(32).toString('hex')
  const reset_token_expires_at  = new Date(Date.now() + 1000 * 60 * 60) // 1 hora

  await prisma.user.update({ where: { id: user.id }, data: { reset_token, reset_token_expires_at } })

  // TODO: enviar email con reset_token
  res.json({ message: 'Si el email existe recibirás un enlace de recuperación' })
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body

  if (!password || password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    return
  }

  const user = await prisma.user.findFirst({
    where: { reset_token: token, reset_token_expires_at: { gt: new Date() } },
  })

  if (!user) { res.status(400).json({ error: 'Token inválido o expirado' }); return }

  const password_hash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash, reset_token: null, reset_token_expires_at: null },
  })

  res.json({ message: 'Contraseña actualizada correctamente' })
})

// POST /api/auth/logout — revoca el token actual añadiéndolo a la denylist.
// Como los JWT son stateless, esto solo es efectivo con Redis configurado.
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  if (!redis) {
    res.json({ message: 'Sesión cerrada (revocación de token requiere Redis)' })
    return
  }
  if (req.jti && req.tokenExp) {
    // Keep the entry only until the token would expire anyway.
    const ttl = Math.max(1, req.tokenExp - Math.floor(Date.now() / 1000))
    try {
      await redis.set(`denylist:${req.jti}`, 1, { ex: ttl })
    } catch (err) {
      console.error('[logout] denylist write failed:', (err as Error).message)
    }
  }
  res.json({ message: 'Sesión cerrada correctamente' })
})

// GET /api/auth/me — datos del usuario autenticado
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, email: true, role: true, email_verified: true, created_at: true },
  })
  res.json(user)
})

export default router
