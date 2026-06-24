import { Router, Request, Response } from 'express'
import { runAgent, ModelBusyError } from '../lib/agent'

const router = Router()

const MAX_QUESTION_LENGTH = 500

router.post('/', async (req: Request, res: Response) => {
  const { question } = req.body as { question?: unknown }

  if (typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'question is required.' })
    return
  }
  if (question.trim().length > MAX_QUESTION_LENGTH) {
    res.status(400).json({ error: `question must be at most ${MAX_QUESTION_LENGTH} characters.` })
    return
  }

  try {
    const answer = await runAgent(question.trim())
    res.json({ answer })
  } catch (err) {
    if (err instanceof ModelBusyError) {
      res.status(503).json({ error: err.message })
      return
    }
    console.error('[chat] unexpected error:', err)
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
})

export default router
