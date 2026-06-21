import { useEffect, useRef } from 'react'
import { GOOGLE_CLIENT_ID } from '../lib/api'

// Minimal typing for the Google Identity Services global we use.
interface GoogleCredentialResponse { credential: string }
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string
            callback: (res: GoogleCredentialResponse) => void
          }) => void
          renderButton: (parent: HTMLElement, opts: Record<string, unknown>) => void
        }
      }
    }
  }
}

// hl=en forces the Google button text to English to match the rest of the UI
// (otherwise Google localizes it to the visitor's browser language).
const GSI_SRC = 'https://accounts.google.com/gsi/client?hl=en'

// Loads the GSI script once and resolves when window.google is ready.
let gsiPromise: Promise<void> | null = null
function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google) return resolve()
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
  return gsiPromise
}

interface Props {
  /** Called with the Google ID token when the user signs in. */
  onCredential: (credential: string) => void
  onError?: (message: string) => void
  /** Dark UI by default — matches the modal. */
  theme?: 'outline' | 'filled_black' | 'filled_blue'
}

export default function GoogleSignInButton({ onCredential, onError, theme = 'filled_black' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Keep the latest callback without re-initializing GSI on every render.
  const cbRef = useRef(onCredential)
  cbRef.current = onCredential

  useEffect(() => {
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => cbRef.current(res.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme,
          size: 'large',
          width: 336,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        })
      })
      .catch((e: Error) => onError?.(e.message))
    return () => { cancelled = true }
  }, [theme, onError])

  // Centered so the fixed-width Google button sits in the middle of the modal.
  return <div ref={ref} className="flex justify-center" />
}
