import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import articlesRouter    from './routes/articles'
import authRouter        from './routes/auth'
import newsletterRouter  from './routes/newsletter'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5177' }))
app.use(express.json())

app.use('/api/articles',   articlesRouter)
app.use('/api/auth',       authRouter)
app.use('/api/newsletter', newsletterRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})
