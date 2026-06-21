import { Response } from 'express'
import { config } from '../config'

export const AUTH_COOKIE = 'auth_token'
export const CSRF_COOKIE = 'csrf_token'

const MAX_AGE = 24 * 60 * 60 * 1000 // 1 day — matches the default JWT TTL

// In production (HTTPS, possibly cross-site frontend↔API) we need SameSite=None
// + Secure. In local dev (http://localhost, same-site different ports) Lax works
// and Secure must be off so the browser stores the cookie over http.
const sameSite = config.isProd ? ('none' as const) : ('lax' as const)
const secure   = config.isProd

const base = { sameSite, secure, path: '/' }

// Sets the httpOnly auth cookie (JWT — never readable by JS) plus a readable
// CSRF token cookie for the double-submit pattern.
export function setAuthCookies(res: Response, token: string, csrfToken: string) {
  res.cookie(AUTH_COOKIE, token,     { ...base, httpOnly: true,  maxAge: MAX_AGE })
  res.cookie(CSRF_COOKIE, csrfToken, { ...base, httpOnly: false, maxAge: MAX_AGE })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(AUTH_COOKIE, { ...base, httpOnly: true })
  res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false })
}
