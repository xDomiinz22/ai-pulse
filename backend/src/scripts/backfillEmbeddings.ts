import 'dotenv/config'
import prisma from '../lib/prisma'
import {
  articleEmbeddingText,
  generateEmbedding,
  toVectorLiteral,
} from '../lib/embeddings'

// One-off script: generate and store embeddings for every article that doesn't
// have one yet. Safe to re-run — it only touches rows where embedding IS NULL.
async function main() {
  // Unsupported (vector) columns aren't queryable via the Prisma client API,
  // so we use raw SQL to find the rows that still need an embedding.
  const rows = await prisma.$queryRaw<
    Array<{ id: number; title: string; short_summary: string | null }>
  >`SELECT id, title, short_summary FROM articles WHERE embedding IS NULL ORDER BY id`

  console.log(`Articles without embedding: ${rows.length}`)
  if (rows.length === 0) {
    console.log('Nothing to do.')
    return
  }

  let done = 0
  for (const row of rows) {
    try {
      const text = articleEmbeddingText(row.title, row.short_summary)
      const vec = await generateEmbedding(text)
      const literal = toVectorLiteral(vec)
      await prisma.$executeRaw`UPDATE articles SET embedding = ${literal}::vector WHERE id = ${row.id}`
      done++
      console.log(`  [${done}/${rows.length}] #${row.id} embedded (${vec.length} dims) — ${row.title.slice(0, 50)}`)
      // Gentle pacing to stay well under the embedding rate limit.
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.error(`  ✗ #${row.id} failed:`, (err as Error).message)
    }
  }

  console.log(`\nDone. Embedded ${done}/${rows.length} articles.`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
