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
import newsletterRouter  from './routes/newsletter'
import { runScraper }    from './services/scraper'
import { authenticate, requireAdmin } from './middleware/auth'
import { csrfProtection } from './middleware/csrf'
import { globalLimiter, authLimiter, writeLimiter, chatLimiter } from './middleware/rateLimit'
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

// On Vercel "Services" the backend is mounted at routePrefix /api and Vercel
// strips that prefix before the request reaches Express, so routes must live at
// the root (Vercel sets the VERCEL env var automatically). In local dev there
// is no stripping, so we keep the /api prefix to match the frontend's calls.
const P = process.env.VERCEL ? '' : '/api'

app.use(`${P}/auth`,       authLimiter, authRouter)
app.use(`${P}/articles`,   articlesRouter)
app.use(`${P}/chat`,       chatLimiter, chatRouter)
app.use(`${P}/newsletter`, writeLimiter, newsletterRouter)

app.get(`${P}/health`, (_req, res) => res.json({ status: 'ok' }))

// Manual scraper trigger — admin only + throttled
app.post(`${P}/scraper/run`, csrfProtection, authenticate, requireAdmin, writeLimiter, (_req, res) => {
  res.json({ message: 'Scraper started in background' })
  runScraper().catch(console.error)
})

// Cron trigger endpoint — protected by a shared secret if CRON_SECRET is set
app.get(`${P}/cron/scraper`, (req, res) => {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  res.json({ message: 'Scraper triggered' })
  runScraper().catch(console.error)
})

app.use(notFound)
app.use(errorHandler)

export default app
