import { useAuth } from '../hooks/useAuth.ts'

export function TasksPage() {
  const { user } = useAuth()
  const account = user?.email ?? 'tu cuenta'

  return (
    <section className="panel" aria-labelledby="tasks-title">
      <h2 id="tasks-title">Tus tareas</h2>
      <p>Sesión iniciada como {account}. El listado se conecta en la próxima parte.</p>
    </section>
  )
}
