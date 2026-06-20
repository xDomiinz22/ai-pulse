import { redis } from './redis'

// ─── Generic read-through cache ──────────────────────────────────────────────
// Returns the cached value if present, otherwise runs `producer`, stores the
// result with a TTL, and returns it. Fully transparent when Redis is absent.
export async function cached<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
  if (!redis) return producer()

  try {
    const hit = await redis.get<T>(key)
    if (hit !== null && hit !== undefined) return hit
  } catch (err) {
    console.error('[cache] read error:', (err as Error).message)
  }

  const fresh = await producer()

  try {
    await redis.set(key, fresh, { ex: ttlSeconds })
  } catch (err) {
    console.error('[cache] write error:', (err as Error).message)
  }

  return fresh
}

// ─── Version-based invalidation ──────────────────────────────────────────────
// Instead of scanning/deleting keys, every cache key embeds a global version
// number. Bumping the version (on any write) makes all previous keys
// unreachable; they expire on their own via TTL. Cheap and Upstash-friendly.
const VERSION_KEY = 'articles:version'

export async function articlesVersion(): Promise<number> {
  if (!redis) return 0
  try {
    const v = await redis.get<number>(VERSION_KEY)
    return typeof v === 'number' ? v : 0
  } catch {
    return 0
  }
}

export async function bumpArticlesVersion(): Promise<void> {
  if (!redis) return
  try {
    await redis.incr(VERSION_KEY)
  } catch (err) {
    console.error('[cache] bump error:', (err as Error).message)
  }
}
