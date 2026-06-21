import cron from 'node-cron'
import app from './app'
import { config } from './config'
import { runScraper } from './services/scraper'

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`)
  runScraper().catch(console.error)
  cron.schedule('0 * * * *', () => runScraper().catch(console.error))
})
