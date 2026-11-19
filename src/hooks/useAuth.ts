import { useContext } from 'react'
import { AuthContext } from '../context/auth-context.ts'

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth tiene que usarse dentro de AuthProvider.')
  }

  return value
}
