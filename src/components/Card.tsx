import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Article } from '../types'
import { cn } from '../utils'

const CATEGORY_LABELS: Record<string, string> = {
  model:    'Modelos de IA',
  research: 'Investigación científica',
  industry: 'Noticias de industria',
  ethics:   'Ética e impacto social',
}

const TAG_STYLES: Record<string, string> = {
  model:    'bg-[#6c63ff]/10 text-[#6c63ff] border border-[#6c63ff]/25',
  research: 'bg-[#3ecfcf]/10 text-[#3ecfcf] border border-[#3ecfcf]/20',
  industry: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  ethics:   'bg-rose-500/10 text-rose-500 border border-rose-500/20',
}

interface Props {
  article: Article
  featured?: boolean
}

export default function Card({ article, featured }: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const tagRef  = useRef<HTMLSpanElement>(null)

  const relativeDate = formatDistanceToNow(parseISO(article.date), { locale: es, addSuffix: true })
  const fullDate     = parseISO(article.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // GSAP: inclinación 3D mientras el cursor está sobre la tarjeta
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 2
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 2
      gsap.to(card, { rotateY: x * 6, rotateX: -y * 5, y: -4, transformPerspective: 900, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
    }
    const onLeave = () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    }

    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    return () => {
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Tippy: tooltip en el tag con la descripción de la categoría
  useEffect(() => {
    if (!tagRef.current) return
    const instance = tippy(tagRef.current, {
      content: CATEGORY_LABELS[article.category],
      placement: 'top',
      theme: 'aipulse',
      animation: 'shift-away',
      delay: [200, 0],
    })
    return () => instance.destroy()
  }, [article.category])

  return (
    <article
      ref={cardRef}
      className={cn(
        'card-item flex flex-col gap-3.5 rounded-[14px] p-7',
        'bg-[var(--bg-card)] border border-[var(--border)]',
        'transition-colors duration-[250ms]',
        'hover:bg-[var(--bg-card-h)] hover:border-[var(--border-h)]',
        'hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
        featured && 'col-span-2 row-span-2',
      )}
    >
      {/* Cabecera: tag + fecha */}
      <div className="flex items-center justify-between">
        <span
          ref={tagRef}
          className={cn(
            'text-[11px] font-bold tracking-[.06em] uppercase px-2.5 py-1 rounded-full cursor-default',
            TAG_STYLES[article.category],
          )}
        >
          {CATEGORY_LABELS[article.category]}
        </span>
        <span className="text-xs text-[var(--text-3)]" title={fullDate}>
          {relativeDate}
        </span>
      </div>

      {/* Título */}
      <h2 className={cn(
        'font-head font-semibold leading-snug text-[var(--text-1)]',
        featured ? 'text-[22px] leading-[1.3]' : 'text-[16px]',
      )}>
        {article.title}
      </h2>

      {/* Extracto */}
      <p className="text-sm leading-[1.7] text-[var(--text-2)] flex-1">
        {article.excerpt}
      </p>

      {/* Pie: enlace + tiempo de lectura */}
      <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-[var(--border)]">
        <a href="#" className="text-[13px] font-semibold text-[#6c63ff] hover:text-[#3ecfcf] transition-colors duration-200">
          {featured ? 'Leer artículo →' : 'Leer →'}
        </a>
        <span className="text-xs text-[var(--text-3)]">{article.readTime} min</span>
      </div>
    </article>
  )
}
