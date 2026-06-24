import 'dotenv/config'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import prisma from '../lib/prisma'
import { searchArticles } from '../lib/articleSearch'

// ── AI Agent: tool-use loop over the AI Pulse news database ────────────────
// The model can call search_articles as many times as it wants; we execute
// each call and feed the result back until the model produces a final text
// answer (no more function calls).

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash'

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

// Retry with exponential back-off on 503/429 ("model busy" / rate limit).
// Throws ModelBusyError when retries are exhausted so callers can surface a
// user-friendly message without catching raw SDK errors.
export async function withRetry<T>(fn: () => Promise<T>, retries = 6): Promise<T> {
  let lastStatus: 503 | 429 = 503
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const status = (err as { status?: number }).status
      if ((status === 503 || status === 429) && i < retries - 1) {
        lastStatus = status as 503 | 429
        const wait = (i + 1) * 5_000
        console.warn(`  (model busy [${status}], retrying in ${wait / 1000}s...)`)
        await new Promise(r => setTimeout(r, wait))
      } else {
        throw err
      }
    }
  }
  throw new ModelBusyError(lastStatus)
}

// ── Agent loop ─────────────────────────────────────────────────────────────
// Runs until the model produces a text answer with no pending tool calls.
// Each iteration: model responds → we execute any tool calls → feed results back.

export async function runAgent(question: string): Promise<string> {
  const chat = model.startChat()
  let response = await withRetry(() => chat.sendMessage(question))

  for (;;) {
    const calls = response.functionCalls()

    // No tool calls → the model produced its final text answer
    if (!calls || calls.length === 0) {
      return response.text()
    }

    // Execute every tool call the model requested (currently only search_articles)
    const toolResponses = await Promise.all(
      calls.map(async call => {
        if (call.name === 'search_articles') {
          const { query } = call.args as { query: string }
          const articles = await searchArticles(query, 5)
          console.log(`\n📚 [${call.name}] query="${query}" → ${articles.length} articles`)
          articles.forEach(a => console.log(`   · [${a.category}] ${a.title.slice(0, 70)}`))
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
        // Unknown tool — return empty so the model can recover gracefully
        console.warn(`  [unknown tool: ${call.name}]`)
        return { functionResponse: { name: call.name, response: {} } }
      }),
    )

    // Feed all tool results back and let the model decide what to do next
    response = await withRetry(() => chat.sendMessage(toolResponses))
  }
}

// ── CLI entry point ────────────────────────────────────────────────────────

async function main() {
  const question = process.argv[2] || 'What has OpenAI been doing recently?'
  console.log(`\n❓ Question: ${question}  (model: ${CHAT_MODEL})`)

  try {
    const answer = await runAgent(question)
    console.log('\n💬 Final answer:\n')
    console.log(answer)
  } catch (err) {
    if (err instanceof ModelBusyError) {
      console.error(`\n⚠️  ${err.message}`)
    } else {
      throw err
    }
  }
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
