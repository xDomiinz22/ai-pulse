// In production (Vercel "Services") the backend lives on the same origin under
// /api, so requests are relative (e.g. "/api/auth/login"). In local dev they
// go to the standalone backend on :3001. An explicit VITE_API_URL always wins
// if set; otherwise we pick based on the build mode.
export const API =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001')

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  email: string
  role: string
}

// Public Google OAuth Client ID (safe to ship in the frontend). Overridable
// via env; defaults to the project's client so local dev works with no setup.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  '981095267383-jd4d70oquqn2hapea4e9eb88hllg8u7b.apps.googleusercontent.com'

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

// Sign in / sign up with the Google ID token (credential) from GSI.
export async function googleLogin(credential: string): Promise<User> {
  const res = await fetch(`${API}/api/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed')
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
