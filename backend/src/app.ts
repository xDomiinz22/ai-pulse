import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { config } from './config'
import articlesRouter    from './routes/articles'
import authRouter        from './routes/auth'
import chatRouter        from './routes/chat'
import mcpRouter         from './routes/mcp'
import newsletterRouter  from './routes/newsletter'
import { runScraper }    from './services/scraper'
import { authenticate, requireAdmin } from './middleware/auth'
import { csrfProtection } from './middleware/csrf'
import { globalLimiter, authLimiter, writeLimiter, chatLimiter, mcpLimiter } from './middleware/rateLimit'
import { notFound, errorHandler } from './middleware/errorHandler'

const app = express()

app.set('trust proxy', 1)

app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  frameguard: { action: 'deny' },
  hsts: config.isProd ? undefined : false,
}))

app.use(cors({ origin: config.frontendUrl, credentials: true }))
app.use(morgan(config.isProd ? 'combined' : 'dev'))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(globalLimiter)

// Vercel's services model forwards the original request path to the service
// (`/api/health` arrives as `/api/health`, not `/health`), so the prefix is
// the same here as it is locally.
const P = '/api'

app.use(`${P}/auth`,       authLimiter, authRouter)
app.use(`${P}/articles`,   articlesRouter)
app.use(`${P}/chat`,       chatLimiter, chatRouter)
app.use(`${P}/mcp`,        mcpLimiter, mcpRouter)
app.use(`${P}/newsletter`, writeLimiter, newsletterRouter)

app.get(`${P}/health`, (_req, res) => res.json({ status: 'ok' }))

// Manual scraper trigger — admin only + throttled.
// Awaits the run instead of firing-and-forgetting: on Vercel, a serverless
// invocation is torn down once its response is sent, which was silently
// killing runScraper() mid-run every time (confirmed: 5+ weeks with zero
// new articles despite this endpoint reporting success on every call).
app.post(`${P}/scraper/run`, csrfProtection, authenticate, requireAdmin, writeLimiter, async (_req, res) => {
  try {
    await runScraper()
    res.json({ message: 'Scraper run complete' })
  } catch (err) {
    console.error('[scraper/run]', err)
    res.status(500).json({ error: 'Scraper run failed', detail: (err as Error).message })
  }
})

// Cron trigger endpoint — protected by a shared secret if CRON_SECRET is set.
// Same await-before-responding fix as above; the caller (GitHub Actions —
// see .github/workflows/scraper-cron.yml) has no client-side timeout, so a
// multi-minute run is fine. Requires the Vercel function's own max duration
// to cover a full run — verify in the Vercel dashboard if this endpoint
// starts timing out on a large backlog.
app.get(`${P}/cron/scraper`, async (req, res) => {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    await runScraper()
    res.json({ message: 'Scraper run complete' })
  } catch (err) {
    console.error('[cron/scraper]', err)
    res.status(500).json({ error: 'Scraper run failed', detail: (err as Error).message })
  }
})

app.use(notFound)
app.use(errorHandler)

export default app
