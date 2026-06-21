import { Redis } from '@upstash/redis'

// Upstash Redis client over HTTP — works in serverless (Vercel) and locally.
// If the credentials are not configured, `redis` is null and every consumer
// falls back to Postgres / in-memory behaviour (graceful degradation).
const url   = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = url && token ? new Redis({ url, token }) : null

if (redis) {
  console.log('[redis] Upstash connected — cache & Redis features enabled')
} else {
  console.warn('[redis] not configured — running without cache/redis features')
}
