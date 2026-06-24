import { Request, Response, NextFunction, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '../lib/redis'

interface LimiterOpts {
  windowSec: number
  max: number
  prefix: string
  message: string
  skipSuccess?: boolean // only honoured by the in-memory fallback
}

// Builds an Express middleware. When Redis is configured it uses an Upstash
// sliding-window limiter (shared across all serverless instances — essential
// on Vercel). Otherwise it falls back to in-memory express-rate-limit.
function makeLimiter(opts: LimiterOpts): RequestHandler {
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.max, `${opts.windowSec} s`),
      prefix: opts.prefix,
      analytics: false,
    })

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.ip || 'anonymous'
        const { success, limit, remaining, reset } = await limiter.limit(id)
        res.setHeader('RateLimit-Limit', String(limit))
        res.setHeader('RateLimit-Remaining', String(Math.max(0, remaining)))
        res.setHeader('RateLimit-Reset', String(Math.ceil((reset - Date.now()) / 1000)))
        if (!success) {
          res.status(429).json({ error: opts.message })
          return
        }
        next()
      } catch (err) {
        // Fail-open: never block traffic because Redis hiccuped.
        console.error('[ratelimit] error, allowing request:', (err as Error).message)
        next()
      }
    }
  }

  return rateLimit({
    windowMs: opts.windowSec * 1000,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: opts.skipSuccess,
    message: { error: opts.message },
  })
}

// Global throttle on every route.
export const globalLimiter = makeLimiter({
  windowSec: 15 * 60, max: 300, prefix: 'rl:global',
  message: 'Too many requests, please try again later.',
})

// Strict limiter for auth endpoints (brute-force defense).
export const authLimiter = makeLimiter({
  windowSec: 15 * 60, max: 10, prefix: 'rl:auth', skipSuccess: true,
  message: 'Too many authentication attempts, please try again later.',
})

// Limiter for expensive write/trigger endpoints.
export const writeLimiter = makeLimiter({
  windowSec: 60, max: 20, prefix: 'rl:write',
  message: 'Too many requests, please slow down.',
})

// Strict limiter for AI chat (each call hits the Gemini API).
export const chatLimiter = makeLimiter({
  windowSec: 60, max: 5, prefix: 'rl:chat',
  message: 'Too many chat requests. Please wait a moment before asking again.',
})

// Limiter for the MCP endpoint. A search (tools/call) embeds the query via the
// Gemini API, so cap usage. Generous enough for the 3-request handshake
// (initialize + tools/list + tools/call) clients do per search.
export const mcpLimiter = makeLimiter({
  windowSec: 60, max: 30, prefix: 'rl:mcp',
  message: 'Too many MCP requests. Please slow down.',
})
