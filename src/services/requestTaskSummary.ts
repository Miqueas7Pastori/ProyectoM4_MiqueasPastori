import { getIdToken } from './auth.ts'

type SummaryTask = {
  title: string
  completed: boolean
}

const fallback = 'No se pudo enviar el resumen. Intentá de nuevo.'

export async function requestTaskSummary(tasks: SummaryTask[]) {
  const idToken = await getIdToken()
  let response: Response

  try {
    response = await fetch('/api/send-summary', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: tasks.map((task) => ({ title: task.title, completed: task.completed })),
      }),
    })
  } catch {
    throw new Error(fallback)
  }

  let payload: { error?: unknown } = {}
  try {
    payload = (await response.json()) as { error?: unknown }
  } catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : fallback)
  }
}
