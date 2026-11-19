import type { Task } from '../types/task.ts'

export function compareTasks(a: Task, b: Task) {
  if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order
  if (a.order !== null && b.order === null) return -1
  if (a.order === null && b.order !== null) return 1

  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
  if (a.dueDate && !b.dueDate) return -1
  if (!a.dueDate && b.dueDate) return 1

  const aTime = a.createdAt ? Date.parse(a.createdAt) : Number.POSITIVE_INFINITY
  const bTime = b.createdAt ? Date.parse(b.createdAt) : Number.POSITIVE_INFINITY
  return bTime - aTime
}

export function orderForNewTask(tasks: Task[], dueDate: string | null) {
  const sorted = [...tasks].sort(compareTasks)
  const insertAt = sorted.findIndex((task) => {
    if (!dueDate) return false
    if (!task.dueDate) return true
    return dueDate < task.dueDate
  })
  const index = insertAt === -1 ? sorted.length : insertAt
  const previous = index === 0 ? null : (sorted[index - 1].order ?? index - 1)
  const next = index === sorted.length ? null : (sorted[index].order ?? index)

  const before = previous
  const after = next
  if (before === null && after === null) return 0
  if (before === null && after !== null) return after - 1
  if (before !== null && after === null) return before + 1
  if (before !== null && after !== null) return (before + after) / 2
  return 0
}

export function reorderTasks(tasks: Task[], activeId: string, overId: string) {
  const oldIndex = tasks.findIndex((task) => task.id === activeId)
  const newIndex = tasks.findIndex((task) => task.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return []

  const next = [...tasks]
  const [moved] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, moved)
  return next.map((task, order) => ({ id: task.id, order }))
}
