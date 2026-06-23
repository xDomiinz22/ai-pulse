import Parser from 'rss-parser'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../lib/prisma'
import { redis } from '../lib/redis'
import { bumpArticlesVersion } from '../lib/cache'
import { articleEmbeddingText, generateEmbedding, toVectorLiteral } from '../lib/embeddings'

const LOCK_KEY = 'scraper:lock'
const LOCK_TTL = 600 // seconds — auto-releases if a run crashes

const parser = new Parser()
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

const RSS_FEEDS = [
  { url: 'https://feeds.feedburner.com/TechCrunch/AI', name: 'TechCrunch AI' },
  { url: 'https://www.artificialintelligence-news.com/feed/', name: 'AI News' },
  { url: 'https://arxiv.org/rss/cs.AI', name: 'arXiv CS.AI' },
  { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog' },
  { url: 'https://huggingface.co/blog/feed.xml', name: 'Hugging Face' },
  { url: 'https://bair.berkeley.edu/blog/feed.xml', name: 'BAIR Blog' },
]

const CATEGORIES = ['model', 'research', 'industry', 'ethics'] as const
type Category = (typeof CATEGORIES)[number]

// ─── Helpers ────────────────────────────────────────────────────────────────

function cleanRawText(text: string): string {
  return text
    .replace(/â€™/g, '’')
    .replace(/â€œ/g, '“')
    .replace(/â€/g,  '”')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/Â /g,  ' ')
    .replace(/Ã©/g,  'é')
    .replace(/\s+/g, ' ')
    .trim()
}

async function callGemini(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err) {
      const msg = (err as Error).message || ''
      if ((msg.includes('429') || msg.includes('quota')) && i < retries - 1) {
        const wait = (i + 1) * 15000
        console.warn(`[scraper] Rate limit, retrying in ${wait / 1000}s...`)
        await new Promise(r => setTimeout(r, wait))
      } else {
        throw err
      }
    }
  }
  throw new Error('Max retries exceeded')
}

// ─── Gemini analysis: filter + categorize + summarize in a single call ───────

const SUMMARY_MAX_CHARS = 300  // semantic limit for the short_summary field

interface Analysis {
  ai_related: boolean
  category: Category
  summary: string
  read_time: number
}

async function analyzeArticle(title: string, rawText: string): Promise<Analysis | null> {
  const prompt = `You are the editor of an AI news website. Analyze the article below and respond with ONLY a raw JSON object — no markdown, no code fences, no extra text.

Perform these three tasks:

TASK 1 — RELEVANCE FILTER ("ai_related"):
Set "ai_related" to true ONLY if the article's PRIMARY subject is artificial intelligence, machine learning, large language models, neural networks, or AI research. This includes new AI models/products, AI research and papers, AI company news and funding, AI ethics and regulation, and hardware purpose-built for AI workloads.
Set "ai_related" to false if the primary subject is anything else, such as: nuclear/fusion energy, general chip export controls or trade wars (unless specifically about AI chips), social media platforms, VPNs or messaging apps, general finance or politics, non-AI software, or any topic where AI is only mentioned in passing. When in doubt, set false.

TASK 2 — CATEGORY ("category"): If ai_related is true, assign exactly one of:
  "model"    → new AI model releases, benchmarks, capabilities, evals, fine-tuning techniques
  "research" → academic papers, scientific AI discoveries, technical ML breakthroughs
  "industry" → AI business news, funding rounds, acquisitions, company strategy, AI products
  "ethics"   → AI safety, alignment, regulation, AI policy, bias, societal impact of AI
If ai_related is false, set category to "industry" (it will be ignored).

TASK 3 — SUMMARY ("summary"): Write a clean English summary following these rules:
  - Maximum ${SUMMARY_MAX_CHARS} characters total — count characters and stay within the limit.
  - Use complete sentences only. NEVER cut off mid-word or mid-sentence.
  - If a full summary would exceed ${SUMMARY_MAX_CHARS} characters, write a SHORTER one that still ends on a complete sentence. Do not just truncate — rephrase to fit.
  - Strip arXiv boilerplate ("Announce Type: new", "Abstract:"), HTML entities, and encoding artifacts.
  - Be factual and informative, not promotional.
  - If ai_related is false, set summary to an empty string.

TASK 4 — READING TIME ("read_time"): Estimate how many minutes it takes to read the FULL article (not just the snippet), as a whole integer between 1 and 30. Base it on the topic and apparent depth: short news blurbs are 1-3, standard articles 4-8, long research papers or deep technical pieces 9+.

Title: ${title}
Text: ${rawText.slice(0, 800)}

Respond with only this JSON:
{"ai_related": boolean, "category": "model|research|industry|ethics", "summary": "...", "read_time": number}`

  try {
    const response = await callGemini(prompt)
    const jsonStr = response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const json = JSON.parse(jsonStr)

    const ai_related = json.ai_related === true
    const rawCat = (json.category || '').toLowerCase().trim()
    const category: Category = CATEGORIES.includes(rawCat as Category) ? rawCat as Category : 'industry'

    // Safety net: enforce the char limit at a sentence boundary even if Gemini overshoots
    let summary = cleanRawText((json.summary || '').trim())
    if (summary.length > SUMMARY_MAX_CHARS) {
      const cut = summary.slice(0, SUMMARY_MAX_CHARS)
      summary = (cut.match(/^.*[.!?]/s)?.[0] ?? cut).trim()
    }

    // Use Gemini's reading-time estimate, clamped to 1-30; fall back to word count
    const parsedRt = Math.round(Number(json.read_time))
    const read_time = Number.isFinite(parsedRt) && parsedRt > 0
      ? Math.min(30, parsedRt)
      : estimateReadTime(rawText)

    return { ai_related, category, summary, read_time }
  } catch (err) {
    console.error('[scraper] Analyze error:', (err as Error).message.slice(0, 80))
    return null  // null → discard (treated as failed analysis)
  }
}

// ─── Main scraper ────────────────────────────────────────────────────────────

function estimateReadTime(text: string): number {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))
}

// Public entry point. Acquires a distributed lock so the scraper never runs
// twice concurrently (cron + manual trigger, or multiple serverless instances).
export async function runScraper(): Promise<void> {
  if (!redis) {
    // No Redis → run directly (single-instance dev behaviour).
    await scrapeFeeds()
    return
  }

  let lockHeld = false      // true only when NX confirms another run holds the lock
  let acquiredLock = false  // true only when WE acquired the lock (so only we release it)
  try {
    const acquired = await redis.set(LOCK_KEY, Date.now(), { nx: true, ex: LOCK_TTL })
    if (acquired === null) lockHeld = true   // key already exists → someone else is running
    else acquiredLock = true
  } catch (err) {
    // Redis error → degrade gracefully and run anyway (never skip on infra failure).
    console.error('[scraper] lock error, running without lock:', (err as Error).message)
  }

  if (lockHeld) {
    console.log('[scraper] Another run is already in progress — skipping')
    return
  }

  try {
    await scrapeFeeds()
  } finally {
    if (acquiredLock) {
      try { await redis.del(LOCK_KEY) } catch { /* lock will expire via TTL */ }
    }
  }
}

async function scrapeFeeds(): Promise<void> {
  console.log('[scraper] Starting...')
  let saved = 0, skipped = 0, filtered = 0

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      console.log(`[scraper] ${feed.name}: ${parsed.items.length} items`)

      for (const item of parsed.items.slice(0, 10)) {
        if (!item.title || !item.link) continue

        // Skip already saved
        const existing = await prisma.article.findUnique({ where: { url: item.link } })
        if (existing) { skipped++; continue }

        const rawText = cleanRawText(item.contentSnippet || item.summary || item.content || '')

        // ── Steps 2-4: single Gemini call → filter + categorize + summarize ──
        await new Promise(r => setTimeout(r, 2000))  // respect 15 req/min limit
        const analysis = await analyzeArticle(item.title, rawText)

        // ── Step 3 (cont.): discard if filtered out or analysis failed ──
        if (!analysis || !analysis.ai_related) {
          console.log(`[scraper] ✗ Filtered: ${item.title.slice(0, 65)}`)
          filtered++
          continue
        }

        // ── Step 5: save to the website's database ──
        const created = await prisma.article.create({
          data: {
            title: cleanRawText(item.title),
            url: item.link,
            short_summary: analysis.summary || null,
            source: feed.name,
            category: analysis.category,
            image_url: (item as any).enclosure?.url || null,
            read_time: analysis.read_time,
            published_at: item.pubDate ? new Date(item.pubDate) : null,
          },
        })

        // ── Step 6: generate + store the embedding for semantic search.
        // Best-effort: a failure here doesn't lose the article (the backfill
        // script can fill any gaps later).
        try {
          const vec = await generateEmbedding(
            articleEmbeddingText(created.title, created.short_summary),
          )
          await prisma.$executeRaw`UPDATE articles SET embedding = ${toVectorLiteral(vec)}::vector WHERE id = ${created.id}`
        } catch (err) {
          console.error(`[scraper] embedding failed for #${created.id}:`, (err as Error).message)
        }

        console.log(`[scraper] ✓ Saved [${analysis.category}]: ${item.title.slice(0, 60)}`)
        saved++
      }
    } catch (err) {
      console.error(`[scraper] Error on ${feed.name}:`, (err as Error).message.slice(0, 100))
    }
  }

  // Invalidate cached article lists/counts so the new articles show up at once.
  if (saved > 0) await bumpArticlesVersion()

  console.log(`[scraper] Done — saved: ${saved}, skipped: ${skipped}, filtered: ${filtered}`)
}
