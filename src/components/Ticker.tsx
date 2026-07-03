'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { API } from '../lib/api'

export interface Head { title: string; url: string }

// A single-headline "wire" rotator that sits under the masthead — the
// interface's terminal accent zone (DESIGN.md §5). Cycles the latest
// headlines one at a time with a typewriter reveal behind a blinking
// spot-colored cursor. Honours prefers-reduced-motion.
//
// With SSR the initial headlines arrive as a prop (already in the server
// HTML), so the "Connecting to the wire…" placeholder only shows if the
// server fetch failed and the client fallback fetch is still in flight.
export default function Ticker({ initialHeads = [] }: { initialHeads?: Head[] }) {
  const [heads, setHeads] = useState<Head[]>(initialHeads)
  const lineRef = useRef<HTMLAnchorElement>(null)
  const idx = useRef(0)

  useEffect(() => {
    if (initialHeads.length > 0) return
    fetch(`${API}/api/articles?limit=12`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.data) setHeads((d.data as Head[]).map(a => ({ title: a.title, url: a.url })))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (heads.length < 2) return
    const el = lineRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const advance = () => {
      const next = (idx.current + 1) % heads.length
      const title = heads[next].title
      const swap = () => {
        idx.current = next
        el.textContent = title
        el.setAttribute('href', heads[next].url)
      }
      if (reduce) { swap(); return }

      gsap.to(el, {
        opacity: 0, duration: 0.15, ease: 'power1.in',
        onComplete: () => {
          idx.current = next
          el.setAttribute('href', heads[next].url)
          el.textContent = ''
          gsap.set(el, { opacity: 1 })
          // Typewriter reveal: character count driven by a dummy tween, capped
          // so long headlines don't take forever to type out.
          const state = { n: 0 }
          gsap.to(state, {
            n: title.length,
            duration: Math.min(title.length * 0.02, 0.9),
            ease: 'none',
            onUpdate: () => { el.textContent = title.slice(0, Math.round(state.n)) },
          })
        },
      })
    }

    const id = setInterval(advance, 4200)
    return () => clearInterval(id)
  }, [heads])

  return (
    <div className="rule-bottom terminal-zone relative">
      <div className="max-w-[1160px] mx-auto px-6 flex items-stretch h-9 overflow-hidden">
        <span className="flex items-center gap-2 flex-none text-[var(--paper)] px-3 font-mono text-[11px] uppercase tracking-[0.1em]">
          <span className="w-[6px] h-[6px] bg-[var(--spot)]" />
          Latest
        </span>
        <span className="flex items-center min-w-0 flex-1 overflow-hidden">
          <span className="term-cursor text-[var(--spot)] font-mono text-[13px] leading-none pl-4 pr-1 select-none" aria-hidden="true">▍</span>
          {heads.length === 0 ? (
            <span className="block truncate font-mono text-[12.5px] text-[var(--paper)] opacity-60 pr-4">
              Connecting to the wire…
            </span>
          ) : (
            <a
              ref={lineRef}
              href={heads[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-mono text-[12.5px] text-[var(--paper)] hover:text-[var(--spot)] transition-colors pr-4"
            >
              {heads[0].title}
            </a>
          )}
        </span>
      </div>
    </div>
  )
}
