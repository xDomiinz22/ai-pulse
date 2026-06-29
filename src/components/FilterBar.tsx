import { useEffect, useRef } from 'react'
import tippy from 'tippy.js'
import type { FilterValue, Category } from '../types'
import { cn } from '../utils'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'model',    label: 'Models' },
  { value: 'research', label: 'Research' },
  { value: 'industry', label: 'Industry' },
  { value: 'ethics',   label: 'Ethics' },
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
  counts: Record<string, number>
}

export default function FilterBar({ active, onChange, counts }: Props) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const instances = FILTERS.flatMap((f, i) => {
      if (f.value === 'all') return []
      const el = btnRefs.current[i]
      if (!el) return []
      const count = counts[f.value] ?? 0
      return [tippy(el, {
        content: `${CATEGORY_LABELS[f.value as Category]} · ${count} article${count !== 1 ? 's' : ''}`,
        placement: 'bottom',
        theme: 'aipulse',
        animation: 'shift-away',
        delay: [300, 0],
      })]
    })
    return () => instances.forEach(i => i.destroy())
  }, [counts])

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-7 rule-bottom pb-3" role="group" aria-label="Filter by section">
      {FILTERS.map((f, i) => (
        <button
          key={f.value}
          ref={el => { btnRefs.current[i] = el }}
          onClick={() => onChange(f.value)}
          className={cn(
            'font-mono text-[12px] uppercase tracking-[0.1em] pb-1 -mb-[13px] border-b-2 transition-colors cursor-pointer',
            active === f.value
              ? 'text-[var(--ink)] border-[var(--spot)]'
              : 'text-[var(--ink-soft)] border-transparent hover:text-[var(--ink)]',
          )}
          aria-label={`Filter by ${f.label}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
