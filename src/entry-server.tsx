import { renderToReadableStream } from 'react-dom/server.edge'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import type { Article, FilterValue, InitialData } from './types'

import clientAssets from './entry-client?assets=client'
import serverAssets from './entry-server?assets=ssr'

const VALID_FILTERS: FilterValue[] = ['all', 'model', 'research', 'industry', 'ethics']

// Same origin/port convention as src/lib/api.ts: standalone Express backend
// on :3001 locally; on Vercel the two "services" share the deployment origin.
const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

interface ListPayload {
  data: Article[]
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // SSR data is best-effort: on failure, App/Ticker fall back to their own
    // client-side fetches (with loading placeholders), same as pure CSR.
    return null
  }
}

async function loadInitialData(url: URL): Promise<InitialData> {
  const rawFilter = url.searchParams.get('filter') as FilterValue | null
  const filter: FilterValue = rawFilter && VALID_FILTERS.includes(rawFilter) ? rawFilter : 'all'
  const query = url.searchParams.get('q') ?? ''

  const listParams = new URLSearchParams()
  if (filter !== 'all') listParams.set('category', filter)
  if (query.trim()) listParams.set('q', query.trim())
  listParams.set('limit', '50')

  const [list, counts, tickerList] = await Promise.all([
    fetchJson<ListPayload>(`/api/articles?${listParams}`),
    fetchJson<Record<string, number>>('/api/articles/category-counts'),
    fetchJson<ListPayload>('/api/articles?limit=12'),
  ])

  return {
    filter,
    query,
    articles: list?.data ?? [],
    counts: counts ?? {},
    heads: (tickerList?.data ?? []).map(a => ({ title: a.title, url: a.url })),
  }
}

export default {
  async fetch(req: Request) {
    const url = new URL(req.url)
    const initialData = await loadInitialData(url)
    const assets = clientAssets.merge(serverAssets)

    // Escape "<" so a headline like "</script>" can't break out of the
    // inline script tag when the payload is embedded as raw JSON text.
    const serialized = JSON.stringify(initialData).replace(/</g, '\\u003c')

    const stream = await renderToReadableStream(
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>AI Pulse — Artificial Intelligence News</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,900;1,9..144,400;1,9..144,600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
          {assets.css.map((attr: Record<string, string>) => (
            <link key={attr.href} rel="stylesheet" {...attr} />
          ))}
          {assets.js.map((attr: Record<string, string>) => (
            <link key={attr.href} rel="modulepreload" {...attr} />
          ))}
        </head>
        <body>
          <div id="app">
            <AuthProvider>
              <App initialData={initialData} />
            </AuthProvider>
          </div>
          {/* eslint-disable-next-line react/no-danger */}
          <script dangerouslySetInnerHTML={{ __html: `window.__INITIAL_DATA__=${serialized}` }} />
          <script type="module" src={assets.entry} />
        </body>
      </html>,
      { signal: req.signal },
    )

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    })
  },
}
