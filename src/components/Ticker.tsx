import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { API } from '../lib/api'

interface Head { title: string; url: string }

// A single-headline "wire" rotator that sits under the masthead. Cycles the
// latest headlines one at a time with a discreet GSAP slide+fade, pausing
// nothing else on the page. Honours prefers-reduced-motion.
export default function Ticker() {
  const [heads, setHeads] = useState<Head[]>([])
  const lineRef = useRef<HTMLAnchorElement>(null)
  const idx = useRef(0)

  useEffect(() => {
    fetch(`${API}/api/articles?limit=12`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.data) setHeads((d.data as Head[]).map(a => ({ title: a.title, url: a.url })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (heads.length < 2) return
    const el = lineRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const advance = () => {
      const next = (idx.current + 1) % heads.length
      const swap = () => {
        idx.current = next
        el.textContent = heads[next].title
        el.setAttribute('href', heads[next].url)
      }
      if (reduce) { swap(); return }
      gsap.to(el, {
        opacity: 0, y: -8, duration: 0.35, ease: 'power1.in',
        onComplete: () => {
          swap()
          gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
        },
      })
    }

    const id = setInterval(advance, 4200)
    return () => clearInterval(id)
  }, [heads])

  if (heads.length === 0) return null

  return (
    <div className="rule-bottom bg-[var(--clip)]">
      <div className="max-w-[1160px] mx-auto px-6 flex items-stretch h-9 overflow-hidden">
        <span className="flex items-center gap-2 flex-none bg-[var(--ink)] text-[var(--paper)] px-3 font-mono text-[11px] uppercase tracking-[0.1em]">
          <span className="w-[6px] h-[6px] rounded-full bg-[var(--spot)]" />
          Latest
        </span>
        <span className="flex items-center min-w-0 flex-1 overflow-hidden">
          <a
            ref={lineRef}
            href={heads[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-mono text-[12.5px] text-[var(--ink)] hover:text-[var(--spot)] transition-colors px-4"
          >
            {heads[0].title}
          </a>
        </span>
      </div>
    </div>
  )
}
