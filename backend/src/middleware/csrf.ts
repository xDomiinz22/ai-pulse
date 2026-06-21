import { Request, Response, NextFunction } from 'express'
import { CSRF_COOKIE } from '../lib/cookies'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Double-submit cookie CSRF protection. For mutating requests the
// X-CSRF-Token header must match the csrf_token cookie. A cross-origin
// attacker can neither read the cookie (same-origin policy) nor set the
// custom header (blocked by CORS preflight), so forged requests fail.
// Apply this only to cookie-authenticated mutating routes.
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) { next(); return }

  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.get('X-CSRF-Token')

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'CSRF token inválido o ausente' })
    return
  }
  next()
}
