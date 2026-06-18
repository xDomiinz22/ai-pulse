import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
  userRole?: string
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' })
    return
  }
  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as unknown as { sub: number; role: string }
    req.userId   = payload.sub
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Acceso restringido' })
    return
  }
  next()
}
