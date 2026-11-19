import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { renderWithProviders } from './test/renderWithProviders.tsx'

vi.mock('./services/firebase.ts', () => ({
  auth: null,
  db: null,
  isFirebaseConfigured: false,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(),
}))

describe('App', () => {
  it('muestra el título de la aplicación', () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Gestor de tareas' }),
    ).toBeInTheDocument()
  })

  it('presenta el objetivo de la aplicación', () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole('heading', { name: 'Organizá el trabajo del día' }),
    ).toBeInTheDocument()
  })
})
