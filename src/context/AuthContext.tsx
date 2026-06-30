import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  googleLogin as apiGoogleLogin,
  logout as apiLogout,
  type User,
} from '../lib/api'
import AuthModal from '../components/AuthModal'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  logout: () => Promise<void>
  openAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const [authOpen, setAuthOpen] = useState(false)

  // Restore the session from the httpOnly cookie on first load.
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    setUser(await apiLogin(email, password))
  }
  const register = async (username: string, email: string, password: string) => {
    setUser(await apiRegister(username, email, password))
  }
  const googleLogin = async (credential: string) => {
    setUser(await apiGoogleLogin(credential))
  }
  const logout = async () => {
    await apiLogout()
    setUser(null)
  }
  const openAuthModal = () => setAuthOpen(true)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, openAuthModal }}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
