export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
}

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  configured: boolean
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}
