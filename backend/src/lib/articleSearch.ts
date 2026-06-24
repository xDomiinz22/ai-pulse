import prisma from './prisma'
import { generateEmbedding, toVectorLiteral } from './embeddings'

export interface FoundArticle {
  id: number
  title: string
  short_summary: string | null
  category: string
  source: string | null
  url: string
  distance: number
}

// Semantic search over the article embeddings: embed the query, then return the
// nearest articles by cosine distance (pgvector <=>). This is the retrieval
// step of the RAG/agent — cheap, no text-generation model involved.
export async function searchArticles(query: string, k = 5): Promise<FoundArticle[]> {
  const vec = toVectorLiteral(await generateEmbedding(query))
  return prisma.$queryRaw<FoundArticle[]>`
    SELECT id, title, short_summary, category, source, url,
           embedding <=> ${vec}::vector AS distance
    FROM articles
    WHERE embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT ${k}
  `
}
