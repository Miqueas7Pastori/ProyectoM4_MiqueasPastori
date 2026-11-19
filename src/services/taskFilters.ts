import type { Task } from '../types/task.ts'

export type TaskFilter = 'all' | 'pending' | 'completed'

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === 'pending') return tasks.filter((task) => !task.completed)
  if (filter === 'completed') return tasks.filter((task) => task.completed)
  return tasks
}
