import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cron from 'node-cron'
import { config } from './config'
import articlesRouter    from './routes/articles'
import authRouter        from './routes/auth'
import newsletterRouter  from './routes/newsletter'
import { runScraper }    from './services/scraper'
import { authenticate, requireAdmin } from './middleware/auth'
import { globalLimiter, authLimiter, writeLimiter } from './middleware/rateLimit'
import { notFound, errorHandler } from './middleware/errorHandler'

const app = express()

// Trust the first proxy hop so req.ip reflects the real client behind a
// reverse proxy / Vercel — required for correct per-IP rate limiting.
app.set('trust proxy', 1)

// ─── Security headers (helmet) ────────────────────────────────────────────
// Sets X-Content-Type-Options: nosniff, X-Frame-Options: DENY, HSTS, and
// removes X-Powered-By. CSP locked to default-src 'none' since this is a
// pure JSON API that never serves HTML/scripts.
app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  frameguard: { action: 'deny' },          // X-Frame-Options: DENY
  hsts: config.isProd ? undefined : false, // HSTS only meaningful over HTTPS
}))

// ─── CORS — allow only the known frontend origin ───────────────────────────
app.use(cors({ origin: config.frontendUrl, credentials: true }))

// ─── Request logging (centralized monitoring) ──────────────────────────────
app.use(morgan(config.isProd ? 'combined' : 'dev'))

// ─── Body parsing with a size cap (avoid large-payload DoS) ────────────────
app.use(express.json({ limit: '100kb' }))

// ─── Global throttling ──────────────────────────────────────────────────────
app.use(globalLimiter)

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRouter)
app.use('/api/articles',   articlesRouter)
app.use('/api/newsletter', writeLimiter, newsletterRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Manual scraper trigger — admin only + throttled. Triggers expensive Gemini
// calls, so it must never be publicly reachable.
app.post('/api/scraper/run', authenticate, requireAdmin, writeLimiter, (_req, res) => {
  res.json({ message: 'Scraper iniciado en segundo plano' })
  runScraper().catch(console.error)
})

// ─── 404 + centralized error handler (must be last) ────────────────────────
app.use(notFound)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Backend corriendo en http://localhost:${config.port}`)
  // Run scraper on startup, then every hour
  runScraper().catch(console.error)
  cron.schedule('0 * * * *', () => runScraper().catch(console.error))
})
