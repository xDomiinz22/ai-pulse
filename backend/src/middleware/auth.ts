import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { redis } from '../lib/redis'

export interface AuthRequest extends Request {
  userId?: number
  userRole?: string
  jti?: string       // token id, for revocation
  tokenExp?: number  // token expiry (unix seconds), for logout TTL
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' })
    return
  }
  try {
    const token = header.slice(7)
    // Pin the expected algorithm — never trust the `alg` from the token header.
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm],
    }) as unknown as { sub: number; role: string; jti?: string; exp?: number }

    // Reject revoked tokens (logout / ban) via the Redis denylist.
    if (redis && payload.jti) {
      try {
        if (await redis.get(`denylist:${payload.jti}`)) {
          res.status(401).json({ error: 'Token revocado' })
          return
        }
      } catch (err) {
        console.error('[auth] denylist check failed, allowing:', (err as Error).message)
      }
    }

    req.userId   = payload.sub
    req.userRole = payload.role
    req.jti      = payload.jti
    req.tokenExp = payload.exp
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
