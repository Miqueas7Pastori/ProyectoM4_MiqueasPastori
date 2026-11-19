import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth.ts'
import { getAuthErrorMessage } from '../services/authErrors.ts'

export function AppHeader() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setError(null)

    try {
      await logout()
      navigate('/')
    } catch (caught) {
      setError(getAuthErrorMessage(caught))
    }
  }

  return (
    <header className="header">
      <div className="header-bar">
        <Link to="/" className="brand-link">
          <p className="brand">MateCode</p>
          <h1>Gestor de tareas</h1>
        </Link>
        <nav className="nav" aria-label="Cuenta">
          {loading ? (
            <span className="nav-user">Cargando sesión...</span>
          ) : user ? (
            <>
              <span className="nav-user">{user.email}</span>
              <Link className="button button-small" to="/tareas">
                Mis tareas
              </Link>
              <button
                className="button button-small"
                type="button"
                onClick={() => void handleLogout()}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link className="button button-small" to="/login">
                Ingresar
              </Link>
              <Link className="button button-small button-secondary" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </header>
  )
}
