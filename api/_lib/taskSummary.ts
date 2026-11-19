export type SummaryTask = {
  title: string
  completed: boolean
}

export type SummaryEmail = {
  subject: string
  text: string
}

function formatTitles(tasks: SummaryTask[]) {
  if (tasks.length === 0) return '- Ninguna'

  return tasks.map((task) => `- ${task.title}`).join('\n')
}

export function buildTaskSummary(tasks: SummaryTask[]): SummaryEmail {
  const completed = tasks.filter((task) => task.completed)
  const pending = tasks.filter((task) => !task.completed)
  const lines = [
    'Resumen de tus tareas',
    '',
    `Total: ${tasks.length}`,
    `Completadas: ${completed.length}`,
    `Pendientes: ${pending.length}`,
    '',
    'Completadas:',
    formatTitles(completed),
    '',
    'Pendientes:',
    formatTitles(pending),
  ]

  return {
    subject: 'Resumen de tus tareas',
    text: lines.join('\n'),
  }
}
