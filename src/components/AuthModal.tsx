import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { checkPassword, MIN_PASSWORD_SCORE } from '../lib/passwordStrength'
import GoogleSignInButton from './GoogleSignInButton'
import { cn } from '../utils'

interface Props {
  open: boolean
  onClose: () => void
}

type Mode = 'login' | 'register'

// Earthy strength ramp (weak → strong) that sits on the paper palette.
const STRENGTH_COLORS = ['#a23b2b', '#a23b2b', '#b07d2b', '#5f7d4f', '#4a6d39']

export default function AuthModal({ open, onClose }: Props) {
  const { login, register, googleLogin } = useAuth()
  const [mode, setMode]         = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [busy, setBusy]         = useState(false)

  // Always start at the login screen each time the modal is opened, and clear
  // any previous input/state.
  useEffect(() => {
    if (open) {
      setMode('login')
      setUsername(''); setEmail(''); setPassword(''); setConfirm('')
      setError(null)
    }
  }, [open])

  // Clear errors when switching between login/register.
  useEffect(() => { setError(null) }, [mode])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Password strength (register only) — recomputed as the user types.
  const strength = useMemo(
    () => (mode === 'register' ? checkPassword(password) : null),
    [mode, password],
  )

  const passwordsMatch = password === confirm
  const strongEnough   = (strength?.score ?? 0) >= MIN_PASSWORD_SCORE
  const canRegister    = password.length >= 8 && strongEnough && passwordsMatch

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'register') {
      if (!passwordsMatch)  { setError('Passwords do not match'); return }
      if (!strongEnough)    { setError('Password is too weak'); return }
    }

    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else                  await register(username, email, password)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async (credential: string) => {
    setError(null)
    setBusy(true)
    try {
      await googleLogin(credential)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(33,27,22,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-md border border-[var(--rule-strong)] bg-[var(--paper)] p-7 shadow-[0_24px_60px_rgba(33,27,22,0.4)]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-[26px] font-black text-[var(--ink)] leading-none mb-2">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="wire mb-6">
          {mode === 'login' ? 'Sign in to AI Pulse' : 'Join AI Pulse'}
        </p>

        <GoogleSignInButton onCredential={handleGoogle} onError={setError} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] uppercase tracking-wider text-[var(--text-3)]">or</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="input-field"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="input-field"
          />

          {/* Password strength meter (register only) */}
          {mode === 'register' && password && strength && (
            <div className="-mt-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-200"
                    style={{
                      background: i < strength.score
                        ? STRENGTH_COLORS[strength.score]
                        : 'var(--border)',
                    }}
                  />
                ))}
              </div>
              <p className="text-[11px] mt-1" style={{ color: STRENGTH_COLORS[strength.score] }}>
                {strength.label}{strength.hint ? ` — ${strength.hint}` : ''}
              </p>
            </div>
          )}

          {mode === 'register' && (
            <>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="input-field"
              />
              {confirm && !passwordsMatch && (
                <p className="-mt-2 text-[11px] text-[var(--spot)]">Passwords do not match</p>
              )}
            </>
          )}

          {error && <p className="font-body text-[13px] text-[var(--spot)]">{error}</p>}

          <button
            type="submit"
            disabled={busy || (mode === 'register' && !canRegister)}
            className={cn(
              'mt-1 rounded-md px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--paper)] transition-opacity duration-200',
              'bg-[var(--ink)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
            )}
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="font-body text-[14px] text-[var(--ink-soft)] mt-5 text-center">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-[var(--spot)] hover:opacity-70 transition-opacity cursor-pointer"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>,
    document.body,
  )
}
