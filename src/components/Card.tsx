import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Article } from '../types'
import { voteArticle, type VoteType } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils'

const CATEGORY_LABELS: Record<string, string> = {
  model:    'AI Models',
  research: 'Research',
  industry: 'Industry News',
  ethics:   'Ethics & Policy',
}

const TAG_STYLES: Record<string, string> = {
  model:    'bg-[#6c63ff]/10 text-[#6c63ff] border border-[#6c63ff]/25',
  research: 'bg-[#3ecfcf]/10 text-[#3ecfcf] border border-[#3ecfcf]/20',
  industry: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  ethics:   'bg-rose-500/10 text-rose-500 border border-rose-500/20',
}

interface Props {
  article: Article
}

export default function Card({ article }: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const tagRef  = useRef<HTMLSpanElement>(null)
  const { user } = useAuth()

  const [votesUp, setVotesUp]     = useState(article.votes_up)
  const [votesDown, setVotesDown] = useState(article.votes_down)
  const [voted, setVoted]         = useState(false)
  const [voting, setVoting]       = useState(false)

  const handleVote = async (type: VoteType) => {
    if (!user || voted || voting) return
    setVoting(true)
    const result = await voteArticle(article.id, type)
    if (result.ok) {
      if (result.votes_up !== undefined)   setVotesUp(result.votes_up)
      if (result.votes_down !== undefined) setVotesDown(result.votes_down)
      setVoted(true)
    } else if (result.alreadyVoted) {
      setVoted(true) // backend says this IP already voted
    }
    setVoting(false)
  }

  const pubDate = article.published_at ? parseISO(article.published_at) : null
  const relativeDate = pubDate
    ? formatDistanceToNow(pubDate, { addSuffix: true })
    : null
  const fullDate = pubDate
    ? pubDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

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
      )}
    >
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
        {relativeDate && (
          <span className="text-xs text-[var(--text-3)]" title={fullDate ?? undefined}>
            {relativeDate}
          </span>
        )}
      </div>

      <h2 className="font-head font-semibold leading-snug text-[var(--text-1)] text-[16px]">
        {article.title}
      </h2>

      {article.short_summary && (
        <p className="text-sm leading-[1.7] text-[var(--text-2)] flex-1">
          {article.short_summary}
        </p>
      )}

      {/* Vote controls */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => handleVote('up')}
          disabled={!user || voted || voting}
          aria-label={user ? 'Upvote' : 'Sign in to vote'}
          title={!user ? 'Sign in to vote' : undefined}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors duration-200',
            'border-[var(--border)] text-[var(--text-2)]',
            !user ? 'opacity-40 cursor-not-allowed' : voted ? 'opacity-60 cursor-default' : 'hover:border-[#3ecfcf]/40 hover:text-[#3ecfcf] cursor-pointer',
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
          {votesUp}
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={!user || voted || voting}
          aria-label={user ? 'Downvote' : 'Sign in to vote'}
          title={!user ? 'Sign in to vote' : undefined}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors duration-200',
            'border-[var(--border)] text-[var(--text-2)]',
            !user ? 'opacity-40 cursor-not-allowed' : voted ? 'opacity-60 cursor-default' : 'hover:border-rose-500/40 hover:text-rose-500 cursor-pointer',
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
          </svg>
          {votesDown}
        </button>
        {voted && <span className="text-[11px] text-[var(--text-3)]">Thanks for voting</span>}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-[#6c63ff] hover:text-[#3ecfcf] transition-colors duration-200"
        >
          Read →
        </a>
        <div className="flex items-center gap-3">
          {article.source && (
            <span className="text-xs text-[var(--text-3)]">{article.source}</span>
          )}
          {article.read_time && (
            <span className="text-xs text-[var(--text-3)]">{article.read_time} min</span>
          )}
        </div>
      </div>
    </article>
  )
}
