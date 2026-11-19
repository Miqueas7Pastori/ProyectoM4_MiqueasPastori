import { TodoForm } from '../components/TodoForm.tsx'
import { TodoList } from '../components/TodoList.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useTasks } from '../hooks/useTasks.ts'

export function TasksPage() {
  const { user } = useAuth()

  if (!user) return null

  return <TasksPanel userId={user.uid} email={user.email} />
}

function TasksPanel({ userId, email }: { userId: string; email: string | null }) {
  const { tasks, loading, error } = useTasks(userId)
  const account = email ?? 'tu cuenta'

  return (
    <section className="panel" aria-labelledby="tasks-title">
      <h2 id="tasks-title">Tus tareas</h2>
      <p>Sesión iniciada como {account}.</p>
      <TodoForm userId={userId} tasks={tasks} />
      <TodoList userId={userId} tasks={tasks} loading={loading} error={error} />
    </section>
  )
}
