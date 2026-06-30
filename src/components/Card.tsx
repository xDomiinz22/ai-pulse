import { useState, type CSSProperties } from 'react'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import type { Article } from '../types'
import { voteArticle, type VoteType } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils'

const CATEGORY_LABELS: Record<string, string> = {
  model:    'AI Models',
  research: 'Research',
  industry: 'Industry',
  ethics:   'Ethics & Policy',
}

interface Props {
  article: Article
  featured?: boolean
}

export default function Card({ article, featured = false }: Props) {
  const { user, openAuthModal } = useAuth()

  const [votesUp, setVotesUp]     = useState(article.votes_up)
  const [votesDown, setVotesDown] = useState(article.votes_down)
  const [voted, setVoted]         = useState(false)
  const [voting, setVoting]       = useState(false)
  const [voteError, setVoteError] = useState(false)

  const handleVote = async (type: VoteType) => {
    if (!user || voted || voting) return
    setVoting(true)
    setVoteError(false)
    const result = await voteArticle(article.id, type)
    if (result.ok) {
      if (result.votes_up !== undefined)   setVotesUp(result.votes_up)
      if (result.votes_down !== undefined) setVotesDown(result.votes_down)
      setVoted(true)
    } else if (result.alreadyVoted) {
      setVoted(true)
    } else {
      setVoteError(true)
      setTimeout(() => setVoteError(false), 3000)
    }
    setVoting(false)
  }

  const pubDate = article.published_at ? parseISO(article.published_at) : null
  const dateline = pubDate ? format(pubDate, 'MMM d').toUpperCase() : null
  const relative = pubDate ? formatDistanceToNow(pubDate, { addSuffix: true }) : null

  return (
    <article className="card-item flex flex-col gap-3 bg-[var(--clip)] border border-[var(--rule)] p-6 transition-colors duration-200 hover:bg-[var(--clip-h)] hover:border-[var(--rule-strong)]">

      {/* Kicker: section + dateline */}
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 wire text-[var(--ink)]">
          <span className="w-[7px] h-[7px] bg-[var(--spot)]" />
          {CATEGORY_LABELS[article.category] ?? article.category}
        </span>
        {dateline && <span className="wire" title={relative ?? undefined}>{dateline}</span>}
      </div>

      {/* Headline */}
      <h2 className={cn(
        'font-display font-semibold text-[var(--ink)]',
        featured ? 'text-[26px] leading-[1.15]' : 'text-[20px] leading-[1.2]',
      )} style={featured ? { textWrap: 'balance' } as CSSProperties : undefined}>
        <a href={article.url} target="_blank" rel="noopener noreferrer"
          className="underline decoration-[var(--rule)] underline-offset-2 hover:text-[var(--spot)] hover:decoration-[var(--spot)] transition-colors">
          {article.title}
        </a>
      </h2>

      {/* Standfirst */}
      {article.short_summary && (
        <p className={cn(
          'font-body leading-[1.6] text-[var(--ink-soft)] flex-1',
          featured ? 'text-[17px]' : 'text-[15px]',
        )}>
          {article.short_summary}
        </p>
      )}

      {/* Byline + reading time */}
      <div className="wire flex items-center gap-2 pt-1">
        {article.source && <span>Via {article.source}</span>}
        {article.source && article.read_time && <span className="text-[var(--rule-strong)]">·</span>}
        {article.read_time && <span>{article.read_time} min read</span>}
      </div>

      {/* Vote row */}
      <div className="flex items-center gap-2 pt-3 mt-auto border-t border-[var(--rule)]">
        {!user ? (
          <button
            onClick={openAuthModal}
            className="wire text-[var(--ink-soft)] hover:text-[var(--spot)] border-b border-[var(--rule)] hover:border-[var(--spot)] transition-colors pb-0.5 cursor-pointer"
          >
            Sign in to vote
          </button>
        ) : voted ? (
          <span className="wire text-[var(--ink-soft)]">Thanks for voting</span>
        ) : voteError ? (
          <span className="wire text-[var(--spot)]">Couldn't record vote — try again</span>
        ) : (
          <>
            <button
              onClick={() => handleVote('up')}
              disabled={voting}
              aria-label="Upvote"
              className={cn(
                'inline-flex items-center gap-1 font-mono text-[12px] text-[var(--ink)] transition-colors',
                voting ? 'opacity-40 cursor-wait' : 'hover:text-[var(--spot)] cursor-pointer',
              )}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
              {votesUp}
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={voting}
              aria-label="Downvote"
              className={cn(
                'inline-flex items-center gap-1 font-mono text-[12px] text-[var(--ink)] transition-colors',
                voting ? 'opacity-40 cursor-wait' : 'hover:text-[var(--spot)] cursor-pointer',
              )}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
              {votesDown}
            </button>
          </>
        )}
        <a href={article.url} target="_blank" rel="noopener noreferrer"
          className="wire ml-auto text-[var(--spot)] hover:text-[var(--ink)] transition-colors">
          Read →
        </a>
      </div>
    </article>
  )
}
