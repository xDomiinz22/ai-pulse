import { useState } from 'react'
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
}

export default function Card({ article }: Props) {
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
      setVoted(true)
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
      <h2 className="font-display font-semibold leading-[1.2] text-[var(--ink)] text-[20px]">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--spot)] transition-colors">
          {article.title}
        </a>
      </h2>

      {/* Standfirst */}
      {article.short_summary && (
        <p className="font-body text-[15px] leading-[1.6] text-[var(--ink-soft)] flex-1">
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
        <button
          onClick={() => handleVote('up')}
          disabled={!user || voted || voting}
          aria-label={user ? 'Upvote' : 'Sign in to vote'}
          title={!user ? 'Sign in to vote' : undefined}
          className={cn(
            'inline-flex items-center gap-1 font-mono text-[12px] text-[var(--ink)] transition-colors',
            !user ? 'opacity-40 cursor-not-allowed' : voted ? 'opacity-60 cursor-default' : 'hover:text-[var(--spot)] cursor-pointer',
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
            'inline-flex items-center gap-1 font-mono text-[12px] text-[var(--ink)] transition-colors',
            !user ? 'opacity-40 cursor-not-allowed' : voted ? 'opacity-60 cursor-default' : 'hover:text-[var(--spot)] cursor-pointer',
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
          </svg>
          {votesDown}
        </button>
        {voted && <span className="wire ml-1">Thanks for voting</span>}
        <a href={article.url} target="_blank" rel="noopener noreferrer"
          className="wire ml-auto hover:text-[var(--spot)] transition-colors">
          Read →
        </a>
      </div>
    </article>
  )
}
