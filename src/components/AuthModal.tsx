import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { checkPassword, MIN_PASSWORD_SCORE } from '../lib/passwordStrength'
import { cn } from '../utils'

interface Props {
  open: boolean
  onClose: () => void
}

type Mode = 'login' | 'register'

const STRENGTH_COLORS = ['#ef4444', '#ef4444', '#f59e0b', '#3ecfcf', '#22c55e']

export default function AuthModal({ open, onClose }: Props) {
  const { login, register } = useAuth()
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
      if (!passwordsMatch)  { setError('Las contraseñas no coinciden'); return }
      if (!strongEnough)    { setError('La contraseña es demasiado débil'); return }
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

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-head text-[22px] font-semibold text-[var(--text-1)] mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-[13px] text-[var(--text-3)] mb-6">
          {mode === 'login' ? 'Sign in to AI Pulse' : 'Join AI Pulse'}
        </p>

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
                <p className="-mt-2 text-[11px] text-rose-500">Las contraseñas no coinciden</p>
              )}
            </>
          )}

          {error && <p className="text-[13px] text-rose-500">{error}</p>}

          <button
            type="submit"
            disabled={busy || (mode === 'register' && !canRegister)}
            className={cn(
              'mt-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity duration-200',
              'bg-[#6c63ff] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
            )}
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-[13px] text-[var(--text-3)] mt-5 text-center">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-[#6c63ff] hover:text-[#3ecfcf] transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>,
    document.body,
  )
}
