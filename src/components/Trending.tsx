import { useEffect, useState, useCallback } from 'react'
import type { Article } from '../types'
import { API, ARTICLE_VOTED_EVENT } from '../lib/api'

export default function Trending() {
  const [items, setItems] = useState<Article[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    fetch(`${API}/api/articles/trending?limit=5`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return
        setItems((data.data as Article[]).filter(a => (a.votes_up ?? 0) > 0))
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    load()
    window.addEventListener(ARTICLE_VOTED_EVENT, load)
    return () => window.removeEventListener(ARTICLE_VOTED_EVENT, load)
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [])

  if (items.length === 0) {
    if (!loaded) return null
    return (
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4 rule-bottom pb-2">
          <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
            Trending
          </h2>
          <span className="wire">Most read this week</span>
        </div>
        <p className="wire text-[var(--ink-mute)] py-3">
          No votes yet — be the first to weigh in on today's dispatches.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-12">
      {/* Section header, set like a newspaper rubric */}
      <div className="flex items-center gap-3 mb-4 rule-bottom pb-2">
        <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
          Trending
        </h2>
        <span className="wire">Most read this week</span>
      </div>

      <ol className="grid sm:grid-cols-2 gap-x-8">
        {items.map((a, i) => (
          <li key={a.id} className="border-b border-[var(--rule)] last:border-0 sm:[&:nth-last-child(2)]:border-0">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-4 py-3.5"
            >
              <span className="font-display text-[28px] font-black leading-none text-[var(--rule-strong)] w-8 flex-none text-right group-hover:text-[var(--spot)] transition-colors">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[15px] leading-snug text-[var(--ink)] line-clamp-2 group-hover:text-[var(--spot)] transition-colors">
                  {a.title}
                </p>
                <span className="wire mt-1 block">{a.votes_up} {a.votes_up === 1 ? 'vote' : 'votes'}</span>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
