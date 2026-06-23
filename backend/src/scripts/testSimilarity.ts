import 'dotenv/config'
import prisma from '../lib/prisma'
import { generateEmbedding, toVectorLiteral } from '../lib/embeddings'

// Quick manual check: embed a query and return the closest articles by cosine
// distance (pgvector's <=> operator). Lower distance = more similar.
async function search(query: string, k = 5) {
  const vec = toVectorLiteral(await generateEmbedding(query))
  const rows = await prisma.$queryRaw<
    Array<{ id: number; title: string; category: string; distance: number }>
  >`SELECT id, title, category, embedding <=> ${vec}::vector AS distance
    FROM articles
    WHERE embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT ${k}`

  console.log(`\n🔎 Query: "${query}"`)
  for (const r of rows) {
    console.log(`  ${r.distance.toFixed(3)}  [${r.category}]  ${r.title.slice(0, 60)}`)
  }
}

async function main() {
  await search('OpenAI business and acquisitions')
  await search('reinforcement learning research')
  await search('AI regulation and policy in Europe')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
