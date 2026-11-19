import { useState, type FormEvent } from 'react'
import { createTask, updateTask } from '../services/tasks.ts'
import { orderForNewTask } from '../services/taskOrder.ts'
import { getTaskErrorMessage } from '../services/taskErrors.ts'
import type { Task } from '../types/task.ts'

type TodoFormProps = {
  userId: string
  task?: Task
  tasks?: Task[]
  onDone?: () => void
}

function validate(title: string, description: string, dueDate: string) {
  if (!title) return 'El título es obligatorio.'
  if (title.length > 120) return 'El título puede tener hasta 120 caracteres.'
  if (description.length > 2000) return 'La descripción puede tener hasta 2000 caracteres.'
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return 'La fecha de vencimiento no es válida.'
  }
  return null
}

export function TodoForm({ userId, task, tasks = [], onDone }: TodoFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const fieldId = task ? `task-${task.id}` : 'new-task'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = title.trim()
    const nextDescription = description.trim()
    const nextDueDate = dueDate || null
    const formError = validate(nextTitle, nextDescription, dueDate)

    if (formError) {
      setError(formError)
      return
    }

    setError(null)
    setPending(true)

    try {
      if (task) {
        await updateTask(task.id, {
          userId,
          title: nextTitle,
          description: nextDescription,
          completed: task.completed,
          dueDate: nextDueDate,
          order: task.order ?? 0,
        })
        onDone?.()
      } else {
        await createTask(userId, {
          title: nextTitle,
          description: nextDescription,
          dueDate: nextDueDate,
          order: orderForNewTask(tasks, nextDueDate),
        })
        setTitle('')
        setDescription('')
        setDueDate('')
      }
    } catch (caught) {
      setError(getTaskErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <h3>{task ? 'Editar tarea' : 'Nueva tarea'}</h3>
      <label htmlFor={`${fieldId}-title`}>
        Título
        <input
          id={`${fieldId}-title`}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label htmlFor={`${fieldId}-due`}>
        Vencimiento
        <input
          id={`${fieldId}-due`}
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </label>
      <label htmlFor={`${fieldId}-description`}>
        Descripción
        <textarea
          id={`${fieldId}-description`}
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Guardando...' : task ? 'Guardar cambios' : 'Agregar tarea'}
        </button>
        {task && (
          <button
            className="button button-secondary"
            type="button"
            disabled={pending}
            onClick={onDone}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
