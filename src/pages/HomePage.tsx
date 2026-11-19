import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth.ts'

export function HomePage() {
  const { user, loading } = useAuth()

  return (
    <section className="panel" aria-labelledby="home-title">
      <h2 id="home-title">Organizá el trabajo del día</h2>
      <p>
        Podrás agregar tareas, horarios y ordenarlas según tus prioridades.
      </p>
      <ul>
        <li>Registro e inicio de sesión</li>
        <li>Alta, edición y cierre de tareas</li>
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
