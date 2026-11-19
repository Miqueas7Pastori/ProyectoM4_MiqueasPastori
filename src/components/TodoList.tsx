import { useState } from 'react'
import { useTasks } from '../hooks/useTasks.ts'
import { deleteTask, setTaskCompleted } from '../services/tasks.ts'
import { getTaskErrorMessage } from '../services/taskErrors.ts'
import type { Task } from '../types/task.ts'
import { TodoForm } from './TodoForm.tsx'

export function TodoList({ userId }: { userId: string }) {
  const { tasks, loading, error } = useTasks(userId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function runAction(taskId: string, action: () => Promise<void>) {
    setActionError(null)
    setPendingId(taskId)

    try {
      await action()
    } catch (caught) {
      setActionError(getTaskErrorMessage(caught))
    } finally {
      setPendingId(null)
    }
  }

  function toggleLabel(task: Task) {
    return task.completed
      ? `Marcar ${task.title} como pendiente`
      : `Marcar ${task.title} como completada`
  }

  return (
    <div className="task-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {loading ? (
        <p className="task-message" role="status">
          Cargando tareas...
        </p>
      ) : tasks.length === 0 && !error ? (
        <p className="task-message">Todavía no tenés tareas.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={task.completed ? 'task task-done' : 'task'}>
              {editingId === task.id ? (
                <TodoForm userId={userId} task={task} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="task-top">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      aria-label={toggleLabel(task)}
                      disabled={pendingId === task.id}
                      onChange={() =>
                        void runAction(task.id, () => setTaskCompleted(task.id, !task.completed))
                      }
                    />
                    <div className="task-main">
                      <h3 className="task-title">{task.title}</h3>
                      {task.description && <p className="task-description">{task.description}</p>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      className="button button-small button-secondary"
                      type="button"
                      aria-label={`Editar ${task.title}`}
                      disabled={pendingId === task.id}
                      onClick={() => setEditingId(task.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="button button-small button-danger"
                      type="button"
                      aria-label={`Eliminar ${task.title}`}
                      disabled={pendingId === task.id}
                      onClick={() => void runAction(task.id, () => deleteTask(task.id))}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
