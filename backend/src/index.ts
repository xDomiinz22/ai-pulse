import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import articlesRouter    from './routes/articles'
import authRouter        from './routes/auth'
import newsletterRouter  from './routes/newsletter'
import { runScraper }    from './services/scraper'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5177' }))
app.use(express.json())

app.use('/api/articles',   articlesRouter)
app.use('/api/auth',       authRouter)
app.use('/api/newsletter', newsletterRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Manual trigger (useful for testing without waiting for the cron)
app.post('/api/scraper/run', async (_req, res) => {
  res.json({ message: 'Scraper iniciado en segundo plano' })
  runScraper().catch(console.error)
})

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
  // Run scraper on startup, then every hour
  runScraper().catch(console.error)
  cron.schedule('0 * * * *', () => runScraper().catch(console.error))
})
