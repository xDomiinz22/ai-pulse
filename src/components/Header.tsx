import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import tippy from 'tippy.js'
import { useAuth } from '../context/AuthContext'

interface Props {
  query: string
  onQueryChange: (q: string) => void
}

export default function Header({ query, onQueryChange }: Props) {
  const liveRef = useRef<HTMLSpanElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { user, loading, logout, openAuthModal } = useAuth()

  const dateline = format(new Date(), 'EEEE, MMMM d, yyyy')

  useEffect(() => {
    if (!liveRef.current) return
    const instance = tippy(liveRef.current, {
      content: 'Updated every hour from the wire',
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
    <header className="relative z-10 bg-[var(--paper)]">

      {/* ── Folio line: dateline + utilities ── */}
      <div className="rule-bottom">
        <div className="max-w-[1160px] mx-auto px-6 h-11 flex items-center gap-5">
          <span className="wire hidden md:block">{dateline}</span>

          <div className="flex items-center gap-5 ml-auto">
            {/* Search — underlined, set in mono like a classified field */}
            <div className="relative flex items-center">
              <svg className="absolute left-0 text-[var(--ink-soft)] pointer-events-none" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                defaultValue={query}
                onChange={handleInput}
                placeholder="SEARCH"
                autoComplete="off"
                className="bg-transparent border-b border-[var(--rule-strong)] pl-5 pr-1 py-1 w-28 focus:w-40 outline-none transition-all duration-300 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:border-[var(--spot)]"
              />
            </div>

            {/* Live */}
            <span ref={liveRef} className="hidden sm:flex items-center gap-1.5 wire cursor-default">
              <span className="live-dot w-[6px] h-[6px] rounded-full bg-[var(--spot)]" />
              Live
            </span>

            {/* Auth */}
            {!loading && (
              user ? (
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ink)] text-[var(--paper)] font-mono text-[11px] font-semibold uppercase"
                    title={user.username}
                  >
                    {user.username.slice(0, 1)}
                  </span>
                  <button onClick={() => logout()} className="wire hover:text-[var(--spot)] transition-colors cursor-pointer">
                    Log out
                  </button>
                </div>
              ) : (
                <button onClick={openAuthModal} className="wire hover:text-[var(--spot)] transition-colors cursor-pointer">
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Nameplate ── */}
      <div className="border-b-[3px] border-[var(--ink)]">
        <div className="max-w-[1160px] mx-auto px-6 pt-6 pb-4 text-center">
          <div className="wire mb-2.5">Artificial Intelligence · Reported Hourly</div>
          <a
            href="#"
            className="font-display font-black tracking-[-0.015em] leading-[0.9] text-[var(--ink)] inline-block"
            style={{ fontSize: 'clamp(44px, 9vw, 92px)' }}
          >
            AI&nbsp;Pulse
          </a>
        </div>
      </div>

    </header>
  )
}
