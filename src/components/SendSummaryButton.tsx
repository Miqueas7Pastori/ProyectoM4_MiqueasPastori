import { useState } from 'react'
import { requestTaskSummary } from '../services/requestTaskSummary.ts'

type SummaryTask = {
  title: string
  completed: boolean
}

const fallback = 'No se pudo enviar el resumen. Intentá de nuevo.'

export function SendSummaryButton({ tasks, disabled }: { tasks: SummaryTask[]; disabled: boolean }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleClick() {
    setPending(true)
    setError(null)
    setSent(false)

    try {
      await requestTaskSummary(tasks)
      setSent(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallback)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="summary">
      <button
        className="button button-secondary"
        type="button"
        disabled={disabled || pending}
        onClick={() => void handleClick()}
      >
        {pending ? 'Enviando resumen...' : 'Enviar resumen por email'}
      </button>
      {sent && (
        <p className="form-success" role="status">
          Enviamos el resumen a tu email.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
