import { useRef, useEffect, useLayoutEffect } from 'react'
import gsap from 'gsap'
import type { Article } from '../types'
import Card from './Card'

interface Props {
  articles: Article[]
  isFiltered: boolean
  loading?: boolean
}

export default function NewsGrid({ articles, isFiltered, loading }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const initialRender = useRef(true)

  // useLayoutEffect: aplica el estado inicial (opacity:0) antes del primer paint
  useLayoutEffect(() => {
    if (!gridRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.card-item', {
        opacity: 0,
        y: 20,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.1,
      })
    }, gridRef)
    return () => ctx.revert()
  }, [])

  // GSAP: anima las tarjetas que aparecen al cambiar el filtro o la búsqueda
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    if (!gridRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.card-item', {
        opacity: 0,
        y: 12,
        scale: 0.97,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      })
    }, gridRef)
    return () => ctx.revert()
  }, [articles])

  if (loading) {
    return (
      <p className="text-center py-16 text-[var(--text-3)] text-[15px]">
        Loading news…
      </p>
    )
  }

  if (articles.length === 0) {
    return (
      <p className="text-center py-16 text-[var(--text-3)] text-[15px]">
        No articles found for this selection.
      </p>
    )
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-3 gap-5"
    >
      {articles.map((article, i) => (
        <Card
          key={article.id}
          article={article}
          // La tarjeta destacada solo existe en la vista sin filtro ni búsqueda
          featured={!isFiltered && i === 0}
        />
      ))}
    </div>
  )
}
