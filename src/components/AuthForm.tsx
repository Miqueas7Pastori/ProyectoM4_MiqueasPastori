import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../hooks/useAuth.ts'
import { getAuthErrorMessage } from '../services/authErrors.ts'

type AuthMode = 'login' | 'register'

const copy = {
  login: {
    title: 'Ingresar',
    submit: 'Ingresar',
    submitting: 'Ingresando...',
    switch: '¿No tenés cuenta?',
    switchLabel: 'Registrate',
    switchTo: '/registro',
  },
  register: {
    title: 'Crear cuenta',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta...',
    switch: '¿Ya tenés cuenta?',
    switchLabel: 'Ingresá',
    switchTo: '/login',
  },
} as const

function getFormError(mode: AuthMode, email: string, password: string, confirm: string) {
  if (!email || !password || (mode === 'register' && !confirm)) {
    return 'Completá todos los campos.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'El email no es válido.'
  }

  if (mode === 'register' && password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }

  if (mode === 'register' && password !== confirm) {
    return 'Las contraseñas no coinciden.'
  }

  return null
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { user, loading, configured, login, register, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<'form' | 'google' | null>(null)
  const text = copy[mode]
  const isRegister = mode === 'register'

  if (loading) {
    return <p className="status">Cargando sesión...</p>
  }

  if (user) {
    return <Navigate to="/tareas" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextEmail = email.trim()
    const formError = getFormError(mode, nextEmail, password, confirm)
    if (formError) {
      setError(formError)
      return
    }

    setError(null)
    setPending('form')

    try {
      if (isRegister) {
        await register(nextEmail, password)
      } else {
        await login(nextEmail, password)
      }
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    } finally {
      setPending(null)
    }
  }

  async function handleGoogle() {
    setError(null)
    setPending('google')

    try {
      await loginWithGoogle()
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    } finally {
      setPending(null)
    }
  }

  return (
    <section className="panel" aria-labelledby="auth-title">
      <h2 id="auth-title">{text.title}</h2>
      {!configured && (
        <p className="notice">
          Falta configurar Firebase. Completá las variables VITE_FIREBASE_* en el archivo .env.
        </p>
      )}
      <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label htmlFor="password">
          Contraseña
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {isRegister && (
          <label htmlFor="confirm">
            Confirmar contraseña
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" type="submit" disabled={pending !== null}>
          {pending === 'form' ? text.submitting : text.submit}
        </button>
        <p className="separator">o</p>
        <button
          className="button button-secondary"
          type="button"
          disabled={pending !== null}
          onClick={() => void handleGoogle()}
        >
          {pending === 'google' ? 'Abriendo Google...' : 'Continuar con Google'}
        </button>
      </form>
      <p className="switch">
        {text.switch} <Link to={text.switchTo}>{text.switchLabel}</Link>
      </p>
    </section>
  )
}
