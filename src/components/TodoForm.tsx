import { useState, type FormEvent } from 'react'
import { createTask, updateTask } from '../services/tasks.ts'
import { getTaskErrorMessage } from '../services/taskErrors.ts'
import type { Task } from '../types/task.ts'

type TodoFormProps = {
  userId: string
  task?: Task
  onDone?: () => void
}

function validate(title: string, description: string) {
  if (!title) return 'El título es obligatorio.'
  if (title.length > 120) return 'El título puede tener hasta 120 caracteres.'
  if (description.length > 2000) return 'La descripción puede tener hasta 2000 caracteres.'
  return null
}

export function TodoForm({ userId, task, onDone }: TodoFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const fieldId = task ? `task-${task.id}` : 'new-task'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = title.trim()
    const nextDescription = description.trim()
    const formError = validate(nextTitle, nextDescription)

    if (formError) {
      setError(formError)
      return
    }

    setError(null)
    setPending(true)

    try {
      if (task) {
        await updateTask(task.id, { title: nextTitle, description: nextDescription })
        onDone?.()
      } else {
        await createTask(userId, { title: nextTitle, description: nextDescription })
        setTitle('')
        setDescription('')
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
