import { useEffect, useRef } from 'react'
import tippy from 'tippy.js'
import type { Theme } from '../types'

const ICON_SUN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`

const ICON_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`

interface Props {
  theme: Theme
  onThemeToggle: () => void
  query: string
  onQueryChange: (q: string) => void
}

export default function Header({ theme, onThemeToggle, query, onQueryChange }: Props) {
  const badgeRef    = useRef<HTMLSpanElement>(null)
  const toggleRef   = useRef<HTMLButtonElement>(null)
  let debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tippy en el badge "En vivo"
  useEffect(() => {
    if (!badgeRef.current) return
    const instance = tippy(badgeRef.current, {
      content: 'News updated every hour',
      placement: 'bottom',
      theme: 'aipulse',
    })
    return () => instance.destroy()
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => onQueryChange(e.target.value), 200)
  }

  return (
    <header
      className="sticky top-0 z-[100] border-b border-[var(--border)]"
      style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-[1160px] mx-auto px-6 flex items-center gap-8 h-16">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 flex-shrink-0 font-head text-[18px] font-medium text-[var(--text-1)]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="currentColor"/>
              <circle cx="10" cy="2" r="1.5" fill="currentColor" opacity=".5"/>
              <circle cx="10" cy="18" r="1.5" fill="currentColor" opacity=".5"/>
              <circle cx="2" cy="10" r="1.5" fill="currentColor" opacity=".5"/>
              <circle cx="18" cy="10" r="1.5" fill="currentColor" opacity=".5"/>
            </svg>
          </div>
          AI<strong className="text-[#6c63ff]">Pulse</strong>
        </a>

        {/* Acciones */}
        <div className="flex items-center gap-2.5 ml-auto">

          {/* Búsqueda */}
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 text-[var(--text-3)] pointer-events-none" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              defaultValue={query}
              onChange={handleInput}
              placeholder="Search news…"
              autoComplete="off"
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text-1)] placeholder:text-[var(--text-3)] pl-8 pr-3 py-[7px] w-48 outline-none transition-all duration-300 focus:w-64 focus:border-[#6c63ff] focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"
            />
          </div>

          {/* Toggle de tema */}
          <button
            ref={toggleRef}
            onClick={onThemeToggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition-all duration-200 hover:bg-[var(--bg-card-h)] hover:text-[var(--text-1)] hover:scale-105 active:scale-95 cursor-pointer"
            dangerouslySetInnerHTML={{ __html: theme === 'dark' ? ICON_SUN : ICON_MOON }}
          />

          {/* Badge "En vivo" */}
          <span
            ref={badgeRef}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.04em] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full cursor-default flex-shrink-0"
          >
            <span className="live-dot w-[7px] h-[7px] rounded-full bg-rose-500 flex-shrink-0" />
            Live
          </span>

        </div>
      </div>
    </header>
  )
}
