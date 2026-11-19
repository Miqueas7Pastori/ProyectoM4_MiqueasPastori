import { useState } from 'react'
import { useTasks } from '../hooks/useTasks.ts'
import { filterTasks, type TaskFilter } from '../services/taskFilters.ts'
import { deleteTask, setTaskCompleted } from '../services/tasks.ts'
import { getTaskErrorMessage } from '../services/taskErrors.ts'
import type { Task } from '../types/task.ts'
import { SendSummaryButton } from './SendSummaryButton.tsx'
import { TodoForm } from './TodoForm.tsx'

export function TodoList({ userId }: { userId: string }) {
  const { tasks, loading, error } = useTasks(userId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const visibleTasks = filterTasks(tasks, filter)

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
      {!loading && !error && (
        <div className="task-filters" role="group" aria-label="Filtrar tareas">
          <FilterButton current={filter} value="all" onSelect={setFilter}>
            Todas
          </FilterButton>
          <FilterButton current={filter} value="pending" onSelect={setFilter}>
            Pendientes
          </FilterButton>
          <FilterButton current={filter} value="completed" onSelect={setFilter}>
            Completadas
          </FilterButton>
        </div>
      )}
      {loading ? (
        <p className="task-message" role="status">
          Cargando tareas...
        </p>
      ) : tasks.length === 0 && !error ? (
        <p className="task-message">Todavía no tenés tareas.</p>
      ) : visibleTasks.length === 0 && !error ? (
        <p className="task-message">
          {filter === 'pending' ? 'No hay tareas pendientes.' : 'No hay tareas completadas.'}
        </p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
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
                        void runAction(task.id, () =>
                          setTaskCompleted(
                            task.id,
                            {
                              userId: task.userId,
                              title: task.title,
                              description: task.description,
                              dueDate: task.dueDate,
                            },
                            !task.completed,
                          ),
                        )
                      }
                    />
                    <div className="task-main">
                      <h3 className="task-title">{task.title}</h3>
                      {task.dueDate && <p className="task-due">Vence el {formatDueDate(task.dueDate)}</p>}
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
      <SendSummaryButton tasks={tasks} disabled={loading || error !== null} />
    </div>
  )
}

function formatDueDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function FilterButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: TaskFilter
  value: TaskFilter
  onSelect: (filter: TaskFilter) => void
  children: string
}) {
  const selected = current === value

  return (
    <button
      className={selected ? 'button button-small' : 'button button-small button-secondary'}
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  )
}
