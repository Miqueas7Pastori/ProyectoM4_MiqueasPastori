import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { loginWithEmail, subscribeToAuth } from './services/auth.ts'
import type { AuthUser } from './types/auth.ts'
import { renderWithProviders } from './test/renderWithProviders.tsx'

vi.mock('./services/auth.ts', () => ({
  subscribeToAuth: vi.fn(),
  loginWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  getIdToken: vi.fn(),
}))

const ana: AuthUser = {
  uid: 'ana',
  email: 'ana@mail.com',
  displayName: 'Ana',
}

describe('rutas de autenticación', () => {
  beforeEach(() => {
    vi.mocked(subscribeToAuth).mockImplementation((onChange) => {
      onChange(null)
      return () => {}
    })
    vi.mocked(loginWithEmail).mockReset()
  })

  it('redirige a ingresar si no hay sesión', async () => {
    renderWithProviders(<App />, { route: '/tareas' })

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tus tareas' })).not.toBeInTheDocument()
  })

  it('muestra las tareas cuando hay un usuario', async () => {
    vi.mocked(subscribeToAuth).mockImplementation((onChange) => {
      onChange(ana)
      return () => {}
    })

    renderWithProviders(<App />, { route: '/tareas' })

    expect(await screen.findByRole('heading', { name: 'Tus tareas' })).toBeInTheDocument()
    expect(screen.getByText('Sesión iniciada como ana@mail.com.')).toBeInTheDocument()
  })

  it('no redirige mientras la sesión está cargando', () => {
    vi.mocked(subscribeToAuth).mockImplementation(() => () => {})

    renderWithProviders(<App />, { route: '/tareas' })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando sesión...')
    expect(screen.queryByRole('heading', { name: 'Ingresar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tus tareas' })).not.toBeInTheDocument()
  })

  it('muestra la contraseña incorrecta en el formulario', async () => {
    vi.mocked(loginWithEmail).mockRejectedValue({ code: 'auth/wrong-password' })
    const user = userEvent.setup()

    renderWithProviders(<App />, { route: '/login' })

    await screen.findByRole('heading', { name: 'Ingresar' })
    await user.type(screen.getByLabelText('Email'), 'ana@mail.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreta')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña es incorrecta.')
    expect(loginWithEmail).toHaveBeenCalledWith('ana@mail.com', 'secreta')
  })
})
