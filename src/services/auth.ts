import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import type { AuthUser } from '../types/auth.ts'
import { auth } from './firebase.ts'

function requireAuth() {
  if (!auth) {
    throw Object.assign(new Error('Firebase no está configurado.'), {
      code: 'app/firebase-not-configured',
    })
  }

  return auth
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password)
  return toAuthUser(credential.user)
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password)
  return toAuthUser(credential.user)
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(requireAuth(), provider)
  return toAuthUser(credential.user)
}

export async function signOutUser(): Promise<void> {
  await signOut(requireAuth())
}

export async function getIdToken(): Promise<string> {
  const current = requireAuth().currentUser
  if (!current) {
    throw new Error('Tenés que iniciar sesión para enviar el resumen.')
  }

  try {
    return await current.getIdToken()
  } catch {
    throw new Error('No se pudo confirmar tu sesión. Volvé a ingresar.')
  }
}

export function subscribeToAuth(onChange: (user: AuthUser | null) => void): () => void {
  if (!auth) {
    onChange(null)
    return () => {}
  }

  return onAuthStateChanged(auth, (user) => {
    onChange(user ? toAuthUser(user) : null)
  })
}
