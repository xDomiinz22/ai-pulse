import { useState, useEffect, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'
import { useTheme } from './hooks/useTheme'
import type { Article, FilterValue } from './types'
import Header from './components/Header'
import Hero from './components/Hero'
import FilterBar from './components/FilterBar'
import NewsGrid from './components/NewsGrid'
import Trending from './components/Trending'
import Footer from './components/Footer'
import { API } from './lib/api'

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [filter, setFilter]  = useState<FilterValue>('all')
  const [query,  setQuery]   = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [counts, setCounts]     = useState<Record<string, number>>({})

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('category', filter)
      if (query.trim())     params.set('q', query.trim())
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
    const id = setTimeout(fetchArticles, query.trim() ? 400 : 0)
    return () => clearTimeout(id)
  }, [fetchArticles, query])

  // Real per-category counts for the filter tooltips (independent of the
  // active filter, so the numbers always reflect the whole dataset).
  useEffect(() => {
    fetch(`${API}/api/articles/category-counts`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setCounts(data) })
      .catch(console.error)
  }, [])

  const fuse = useMemo(
    () => new Fuse(articles, {
      keys: [{ name: 'title', weight: 0.7 }, { name: 'short_summary', weight: 0.3 }],
      threshold: 0.35,
    }),
    [articles]
  )

  const visibleArticles = useMemo(() => {
    if (!query.trim()) return articles
    return fuse.search(query).map(r => r.item)
  }, [articles, fuse, query])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] transition-colors duration-300">
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        query={query}
        onQueryChange={setQuery}
      />

      <main>
        <Hero />

        <section className="py-14 pb-24">
          <div className="max-w-[1160px] mx-auto px-6">

            <Trending />

            <div className="flex items-baseline gap-3.5 mb-5">
              <h2 className="font-head text-[22px] font-semibold text-[var(--text-1)]">
                Latest news
              </h2>
              {!loading && (
                <span className="text-[13px] text-[var(--text-3)]">
                  {visibleArticles.length} article{visibleArticles.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <FilterBar active={filter} onChange={setFilter} counts={counts} />

            {error ? (
              <p className="text-center text-[var(--text-3)] py-16">{error}</p>
            ) : (
              <NewsGrid articles={visibleArticles} loading={loading} />
            )}

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
