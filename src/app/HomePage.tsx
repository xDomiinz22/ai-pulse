'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import type { Article, FilterValue } from '../types'
import Header from '../components/Header'
import Ticker, { type Head } from '../components/Ticker'
import Hero from '../components/Hero'
import FilterBar from '../components/FilterBar'
import NewsGrid from '../components/NewsGrid'
import Trending from '../components/Trending'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import { API } from '../lib/api'

interface Props {
  initialFilter: FilterValue
  initialQuery: string
  initialArticles: Article[]
  initialCounts: Record<string, number>
  initialHeads: Head[]
}

export default function HomePage({
  initialFilter,
  initialQuery,
  initialArticles,
  initialCounts,
  initialHeads,
}: Props) {
  const [filter, setFilter] = useState<FilterValue>(initialFilter)
  const [query, setQuery] = useState<string>(initialQuery)
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [loading, setLoading] = useState(initialArticles.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts)

  // The server already rendered the initial filter/query combination; skip the
  // redundant client refetch on hydration and only fetch when they change.
  const hydratedWithData = useRef(initialArticles.length > 0)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('category', filter)
      if (query.trim()) params.set('q', query.trim())
      params.set('limit', '50')

      const res = await fetch(`${API}/api/articles?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setArticles(data.data ?? [])
    } catch (e) {
      setError('Could not load news articles.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filter, query])

  useEffect(() => {
    if (hydratedWithData.current) {
      hydratedWithData.current = false
      setLoading(false)
      return
    }
    const id = setTimeout(fetchArticles, query.trim() ? 400 : 0)
    return () => clearTimeout(id)
  }, [fetchArticles, query])

  // Sync filter + query to URL so views can be bookmarked and shared.
  useEffect(() => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('filter', filter)
    if (query.trim()) params.set('q', query.trim())
    const search = params.toString()
    history.replaceState(null, '', search ? `?${search}` : window.location.pathname)
  }, [filter, query])

  // Real per-category counts for the filter tooltips (independent of the
  // active filter, so the numbers always reflect the whole dataset). Only
  // fetched client-side when the server didn't already provide them.
  useEffect(() => {
    if (Object.keys(initialCounts).length > 0) return
    fetch(`${API}/api/articles/category-counts`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setCounts(data)
      })
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fuse = useMemo(
    () =>
      new Fuse(articles, {
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'short_summary', weight: 0.3 },
        ],
        threshold: 0.45,
        ignoreLocation: true,
      }),
    [articles]
  )

  const visibleArticles = useMemo(() => {
    if (!query.trim()) return articles
    // Strip internal spaces so "Open AI" matches "OpenAI", "GPT 4" matches "GPT-4", etc.
    const q = query.trim()
    const qCompact = q.replace(/\s+/g, '')
    const results = fuse.search(q)
    if (qCompact !== q) {
      const seen = new Set(results.map(r => r.item.id))
      fuse.search(qCompact).forEach(r => {
        if (!seen.has(r.item.id)) results.push(r)
      })
    }
    return results.map(r => r.item)
  }, [articles, fuse, query])

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Header query={query} onQueryChange={setQuery} />
      <Ticker initialHeads={initialHeads} />

      <main>
        <Hero />

        <section className="py-14 pb-24">
          <div className="max-w-[1160px] mx-auto px-6">
            <Trending />

            <div className="w-screen -mx-6 h-[3px] bg-[var(--spot)] mb-8 mt-2" aria-hidden="true" />

            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
                Latest News
              </h2>
              {!loading && (
                <span className="wire">
                  {visibleArticles.length} article{visibleArticles.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <FilterBar active={filter} onChange={setFilter} counts={counts} />

            {error ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <p className="wire text-[var(--ink-soft)]">{error}</p>
                <button
                  onClick={fetchArticles}
                  className="wire text-[var(--ink)] hover:text-[var(--spot)] border-b border-[var(--rule-strong)] hover:border-[var(--spot)] transition-colors pb-0.5 cursor-pointer"
                >
                  Try again →
                </button>
              </div>
            ) : (
              <NewsGrid articles={visibleArticles} loading={loading} />
            )}
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
