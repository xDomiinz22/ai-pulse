export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  email: string
  role: string
}

// Reads the readable CSRF token cookie (set by the backend on login/register)
// to echo it back as a header on mutating requests (double-submit pattern).
function getCsrfToken(): string {
  const m = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export async function getMe(): Promise<User | null> {
  const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' })
  if (!res.ok) return null
  return res.json()
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión')
  return data.user
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'No se pudo crear la cuenta')
  return data.user
}

export async function logout(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': getCsrfToken() },
  })
}

// ─── Voting ──────────────────────────────────────────────────────────────────

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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })

  if (res.status === 429) return { ok: false, alreadyVoted: true }
  if (!res.ok) return { ok: false, alreadyVoted: false }

  const data = await res.json()
  return { ok: true, alreadyVoted: false, votes_up: data.votes_up, votes_down: data.votes_down }
}
