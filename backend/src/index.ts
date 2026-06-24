import app from './app'
import { config } from './config'
import { runScraper } from './services/scraper'

app.listen(config.port, async () => {
  console.log(`Backend running on http://localhost:${config.port}`)
  // node-cron v4 is ESM-only; load it dynamically so this CommonJS module can use it.
  const cron = (await import('node-cron')).default
  cron.schedule('0 * * * *', () => runScraper().catch(console.error))
})
