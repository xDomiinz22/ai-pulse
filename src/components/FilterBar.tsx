import { useEffect, useRef } from 'react'
import tippy from 'tippy.js'
import type { FilterValue, Category } from '../types'
import { ARTICLES } from '../data/articles'
import { cn } from '../utils'

const FILTERS: { value: FilterValue; label: string; dot?: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'model',    label: 'Models',   dot: 'bg-[#6c63ff]' },
  { value: 'research', label: 'Research', dot: 'bg-[#3ecfcf]' },
  { value: 'industry', label: 'Industry', dot: 'bg-amber-500' },
  { value: 'ethics',   label: 'Ethics',   dot: 'bg-rose-500' },
]

const CATEGORY_LABELS: Record<Category, string> = {
  model:    'AI Models',
  research: 'Research',
  industry: 'Industry News',
  ethics:   'Ethics & Policy',
}

interface Props {
  active: FilterValue
  onChange: (f: FilterValue) => void
}

export default function FilterBar({ active, onChange }: Props) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Tippy en cada botón de categoría mostrando el conteo
  useEffect(() => {
    const instances = FILTERS.flatMap((f, i) => {
      if (f.value === 'all') return []
      const el = btnRefs.current[i]
      if (!el) return []
      const count = ARTICLES.filter(a => a.category === f.value).length
      return [tippy(el, {
        content: `${CATEGORY_LABELS[f.value as Category]} · ${count} article${count !== 1 ? 's' : ''}`,
        placement: 'bottom',
        theme: 'aipulse',
        animation: 'shift-away',
        delay: [300, 0],
      })]
    })
    return () => instances.forEach(i => i.destroy())
  }, [])

  return (
    <div className="flex flex-wrap gap-2 mb-7" role="group" aria-label="Filtrar por categoría">
      {FILTERS.map((f, i) => (
        <button
          key={f.value}
          ref={el => { btnRefs.current[i] = el }}
          onClick={() => onChange(f.value)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full border text-[13px] font-medium',
            'transition-all duration-200 cursor-pointer',
            active === f.value
              ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
              : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-card-h)] hover:text-[var(--text-1)] hover:-translate-y-px',
          )}
          aria-label={`Filter by ${f.label}`}
        >
          {f.dot && <span className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0', f.dot)} />}
          {f.label}
        </button>
      ))}
    </div>
  )
}
