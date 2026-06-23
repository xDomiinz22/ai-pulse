// Embeddings use Gemini's dedicated embedding model — cheap, with rate limits
// separate from (and more generous than) Flash text generation, so indexing
// articles never eats into the chat/generation quota.
//
// We call the REST API directly instead of the SDK: the installed
// @google/generative-ai version predates the `outputDimensionality` option,
// which we need to get 768-dim vectors out of gemini-embedding-001.

const MODEL = 'gemini-embedding-001'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`

// gemini-embedding-001 defaults to 3072 dims but accepts outputDimensionality.
// We use 768 to match the vector(768) column and stay within pgvector's HNSW
// index limit (2000 dims). Cosine distance is scale-invariant, so the reduced
// vectors don't need manual normalization.
export const EMBEDDING_DIM = 768

// Turn an article into the text we embed: title carries most of the signal,
// the summary adds context.
export function articleEmbeddingText(title: string, summary?: string | null): string {
  return summary ? `${title}\n\n${summary}` : title
}

// Generate a single embedding vector for the given text.
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIM,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as { embedding?: { values?: number[] } }
  const values = data?.embedding?.values
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding response (got ${values?.length} dims)`)
  }
  return values as number[]
}

// pgvector accepts a string literal of the form "[0.1,0.2,...]".
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`
}
