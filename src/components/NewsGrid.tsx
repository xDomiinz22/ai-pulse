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

  // Discreet scroll reveal: each clipping fades up as it enters the viewport,
  // in small batches. Cards already in view animate in immediately on load.
  useLayoutEffect(() => {
    if (!gridRef.current || articles.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.set('.card-item', { opacity: 0, y: 24 })
      ScrollTrigger.batch('.card-item', {
        start: 'top 88%',
        onEnter: batch =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', overwrite: true }),
      })
      ScrollTrigger.refresh()
    }, gridRef)

    return () => ctx.revert()
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

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {articles.map((article) => (
        <Card key={article.id} article={article} />
      ))}
    </div>
  )
}
