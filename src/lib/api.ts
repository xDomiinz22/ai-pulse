export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export type VoteType = 'up' | 'down'

export interface VoteResult {
  ok: boolean
  alreadyVoted: boolean
  votes_up?: number
  votes_down?: number
}

// Cast a vote on an article. Returns the updated counts, or flags that the
// user already voted (backend anti-spam → HTTP 429).
export async function voteArticle(id: number, type: VoteType): Promise<VoteResult> {
  const res = await fetch(`${API}/api/articles/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })

  if (res.status === 429) return { ok: false, alreadyVoted: true }
  if (!res.ok) return { ok: false, alreadyVoted: false }

  const data = await res.json()
  return { ok: true, alreadyVoted: false, votes_up: data.votes_up, votes_down: data.votes_down }
}
