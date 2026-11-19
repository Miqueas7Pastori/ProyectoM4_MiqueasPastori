import { TodoForm } from '../components/TodoForm.tsx'
import { TodoList } from '../components/TodoList.tsx'
import { useAuth } from '../hooks/useAuth.ts'

export function TasksPage() {
  const { user } = useAuth()

  if (!user) return null

  const account = user.email ?? 'tu cuenta'

  return (
    <section className="panel" aria-labelledby="tasks-title">
      <h2 id="tasks-title">Tus tareas</h2>
      <p>Sesión iniciada como {account}.</p>
      <TodoForm userId={user.uid} />
      <TodoList userId={user.uid} />
    </section>
  )
}
