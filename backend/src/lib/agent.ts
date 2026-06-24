import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { searchArticles } from './articleSearch'

// ── AI Agent: tool-use loop over the AI Pulse news database ────────────────
// The model calls search_articles as many times as it needs; we execute each
// call and feed the result back until the model produces a final text answer.

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash'

const model = genai.getGenerativeModel({
  model: CHAT_MODEL,
  tools: [
    {
      functionDeclarations: [
        {
          name: 'search_articles',
          description:
            'Search the AI Pulse news database for articles relevant to a topic or question. Returns the most semantically similar articles.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              query: {
                type: SchemaType.STRING,
                description:
                  'A short search query describing the topic, e.g. "OpenAI acquisitions" or "EU AI regulation".',
              },
            },
            required: ['query'],
          },
        },
      ],
    },
  ],
  systemInstruction:
    'You are the AI Pulse assistant. Answer questions ONLY using the news articles returned by the search_articles tool. ' +
    'If the tool returns nothing relevant, say you have no news on that topic. Cite the article titles you used.',
})

// ── Model availability helpers ─────────────────────────────────────────────

// Thrown when all retries are exhausted due to 503/429. Routes catch this and
// return a user-friendly message instead of a raw SDK error.
export class ModelBusyError extends Error {
  constructor(status: 503 | 429) {
    super(
      status === 503
        ? 'The AI model is currently experiencing high demand. Please try again in a few seconds.'
        : 'AI request quota temporarily exceeded. Please try again shortly.',
    )
    this.name = 'ModelBusyError'
  }
}

// Retry with exponential back-off on 503/429.
export async function withRetry<T>(fn: () => Promise<T>, retries = 6): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status === 503 || status === 429) {
        if (i < retries - 1) {
          const wait = (i + 1) * 5_000
          console.warn(`  (model busy [${status}], retrying in ${wait / 1000}s...)`)
          await new Promise(r => setTimeout(r, wait))
        } else {
          throw new ModelBusyError(status as 503 | 429)
        }
      } else {
        throw err
      }
    }
  }
  throw new ModelBusyError(503) // unreachable, satisfies TypeScript
}

// ── Agent loop ─────────────────────────────────────────────────────────────

export async function runAgent(question: string): Promise<string> {
  const chat = model.startChat()
  let result = await withRetry(() => chat.sendMessage(question))

  for (;;) {
    const calls = result.response.functionCalls()

    if (!calls || calls.length === 0) {
      return result.response.text()
    }

    const toolResponses = await Promise.all(
      calls.map(async (call: { name: string; args: unknown }) => {
        if (call.name === 'search_articles') {
          const { query } = call.args as { query: string }
          const articles = await searchArticles(query, 5)
          return {
            functionResponse: {
              name: call.name,
              response: {
                articles: articles.map(a => ({
                  title: a.title,
                  summary: a.short_summary,
                  category: a.category,
                  url: a.url,
                  source: a.source,
                })),
              },
            },
          }
        }
        return { functionResponse: { name: call.name, response: {} } }
      }),
    )

    result = await withRetry(() => chat.sendMessage(toolResponses))
  }
}
