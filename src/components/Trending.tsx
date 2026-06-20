import { useEffect, useState } from 'react'
import type { Article } from '../types'
import { API } from '../lib/api'

const DOT: Record<string, string> = {
  model:    'bg-[#6c63ff]',
  research: 'bg-[#3ecfcf]',
  industry: 'bg-amber-500',
  ethics:   'bg-rose-500',
}

export default function Trending() {
  const [items, setItems] = useState<Article[]>([])

  useEffect(() => {
    fetch(`${API}/api/articles/trending?limit=5`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return
        // Only show genuinely trending articles (at least one upvote).
        setItems((data.data as Article[]).filter(a => (a.votes_up ?? 0) > 0))
      })
      .catch(console.error)
  }, [])

  // Nothing trending yet → don't render the section at all.
  if (items.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🔥</span>
        <h2 className="font-head text-[18px] font-semibold text-[var(--text-1)]">Trending</h2>
      </div>

      <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((a, i) => (
          <li key={a.id}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-3.5 bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-h)] hover:border-[var(--border-h)] transition-colors duration-200"
            >
              <span className="font-head text-[20px] font-bold text-[var(--text-3)] w-6 flex-shrink-0 text-center">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--text-1)] leading-snug line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${DOT[a.category]}`} />
                  <span className="text-[11px] text-[var(--text-3)]">{a.votes_up} votes</span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
