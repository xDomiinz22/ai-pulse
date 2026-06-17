import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import { useTheme } from './hooks/useTheme'
import { ARTICLES } from './data/articles'
import type { FilterValue } from './types'
import Header from './components/Header'
import Hero from './components/Hero'
import FilterBar from './components/FilterBar'
import NewsGrid from './components/NewsGrid'
import Footer from './components/Footer'

// Instancia de Fuse creada una sola vez fuera del componente
// (los artículos son estáticos; cuando haya API esto irá dentro de useMemo)
const fuse = new Fuse(ARTICLES, {
  keys: [
    { name: 'title',   weight: 0.7 },
    { name: 'excerpt', weight: 0.3 },
  ],
  threshold: 0.35,
})

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [filter, setFilter]  = useState<FilterValue>('all')
  const [query,  setQuery]   = useState('')

  // Los artículos visibles se derivan del estado: React los recalcula
  // automáticamente cada vez que filter o query cambian
  const visibleArticles = useMemo(() => {
    // 1. Búsqueda fuzzy (si hay query)
    let result = query.trim()
      ? fuse.search(query).map(r => r.item)
      : ARTICLES

    // 2. Filtro por categoría encima del resultado de búsqueda
    if (filter !== 'all') {
      result = result.filter(a => a.category === filter)
    }

    return result
  }, [filter, query])

  const isFiltered = filter !== 'all' || query.trim() !== ''

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

            <div className="flex items-baseline gap-3.5 mb-5">
              <h2 className="font-head text-[22px] font-semibold text-[var(--text-1)]">
                Últimas noticias
              </h2>
              <span className="text-[13px] text-[var(--text-3)]">
                {visibleArticles.length} artículo{visibleArticles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <FilterBar active={filter} onChange={setFilter} />

            <NewsGrid articles={visibleArticles} isFiltered={isFiltered} />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
