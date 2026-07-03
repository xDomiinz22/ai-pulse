import HomePage from './HomePage'
import type { Article, FilterValue } from '../types'

// News page: always render fresh on the server (SSR), never prerender at
// build time — the wire updates hourly and the URL carries filter/query.
export const dynamic = 'force-dynamic'

const VALID_FILTERS: FilterValue[] = ['all', 'model', 'research', 'industry', 'ethics']

// Server-side API base. On Vercel the Express backend is a sibling service on
// the same deployment origin under /api; locally it's the standalone server
// on :3001. An explicit API_URL env var always wins.
const SERVER_API =
  process.env.API_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // SSR data is best-effort: on any failure the client components fall back
    // to their own fetches (with loading placeholders), exactly as the SPA did.
    return null
  }
}

interface ListPayload {
  data: Article[]
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const rawFilter = typeof sp.filter === 'string' ? (sp.filter as FilterValue) : 'all'
  const filter: FilterValue = VALID_FILTERS.includes(rawFilter) ? rawFilter : 'all'
  const query = typeof sp.q === 'string' ? sp.q : ''

  const listParams = new URLSearchParams()
  if (filter !== 'all') listParams.set('category', filter)
  if (query.trim()) listParams.set('q', query.trim())
  listParams.set('limit', '50')

  // Fetch everything the first paint needs in parallel, server-side.
  const [list, counts, tickerList] = await Promise.all([
    fetchJson<ListPayload>(`/api/articles?${listParams}`),
    fetchJson<Record<string, number>>('/api/articles/category-counts'),
    fetchJson<ListPayload>('/api/articles?limit=12'),
  ])

  return (
    <HomePage
      initialFilter={filter}
      initialQuery={query}
      initialArticles={list?.data ?? []}
      initialCounts={counts ?? {}}
      initialHeads={(tickerList?.data ?? []).map(a => ({ title: a.title, url: a.url }))}
    />
  )
}
