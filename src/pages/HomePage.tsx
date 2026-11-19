import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth.ts'

export function HomePage() {
  const { user, loading } = useAuth()

  return (
    <section className="panel" aria-labelledby="home-title">
      <h2 id="home-title">Organizá el trabajo del día</h2>
      <p>
        Cada persona va a poder entrar con su cuenta, guardar sus propias
        tareas y pedir un resumen por email.
      </p>
      <ul>
        <li>Registro e inicio de sesión</li>
        <li>Alta, edición y cierre de tareas</li>
        <li>Resumen del estado por correo</li>
      </ul>
      {!loading && (
        <div className="actions">
          {user ? (
            <Link className="button" to="/tareas">
              Ir a mis tareas
            </Link>
          ) : (
            <>
              <Link className="button" to="/registro">
                Crear cuenta
              </Link>
              <Link className="button button-secondary" to="/login">
                Ingresar
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  )
}
