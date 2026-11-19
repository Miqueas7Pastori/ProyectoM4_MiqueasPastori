import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  loginWithEmail,
  loginWithGoogle as signInWithGoogle,
  registerWithEmail,
  signOutUser,
  subscribeToAuth,
} from '../services/auth.ts'
import { isFirebaseConfigured } from '../services/firebase.ts'
import type { AuthContextValue, AuthUser } from '../types/auth.ts'
import { AuthContext } from './auth-context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeToAuth((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const nextUser = await registerWithEmail(email, password)
    setUser(nextUser)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await loginWithEmail(email, password)
    setUser(nextUser)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const nextUser = await signInWithGoogle()
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    await signOutUser()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      register,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, loading, register, login, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
