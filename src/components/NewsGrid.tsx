import { useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Article } from '../types'
import Card from './Card'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  articles: Article[]
  loading?: boolean
}

export default function NewsGrid({ articles, loading }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<gsap.Context | null>(null)

  useLayoutEffect(() => {
    if (!gridRef.current) return
    ctxRef.current = gsap.context(() => {}, gridRef)
    return () => ctxRef.current?.revert()
  }, [])

  // Discreet scroll reveal: each clipping fades up as it enters the viewport,
  // in small batches. Cards already in view animate in immediately on load.
  // Only NEW cards (no data-revealed yet) are targeted — on a filter/search
  // change the old cards unmount entirely so this naturally covers a full
  // reset, and on "Load more" (append) it skips re-animating cards the
  // reader has already seen instead of flashing the whole grid again.
  useLayoutEffect(() => {
    if (!gridRef.current || articles.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const newCards = gridRef.current.querySelectorAll('.card-item:not([data-revealed="true"])')
    if (newCards.length === 0) return

    ctxRef.current?.add(() => {
      gsap.set(newCards, { opacity: 0, y: 24 })
      ScrollTrigger.batch(newCards, {
        start: 'top 88%',
        onEnter: batch => {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', overwrite: true })
          batch.forEach(el => el.setAttribute('data-revealed', 'true'))
        },
      })
      ScrollTrigger.refresh()
    })
  }, [articles])

  if (loading && articles.length === 0) {
    return (
      <p className="text-center py-16 font-body text-[15px] text-[var(--ink-soft)]">
        Loading the latest news…
      </p>
    )
  }

  if (articles.length === 0) {
    return (
      <p className="text-center py-16 font-body text-[15px] text-[var(--ink-soft)]">
        No articles found for this selection.
      </p>
    )
  }

  const [lead, ...rest] = articles

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <div className="lg:col-span-2">
        <Card article={lead} featured />
      </div>
      {rest.map((article) => (
        <Card key={article.id} article={article} />
      ))}
    </div>
  )
}
