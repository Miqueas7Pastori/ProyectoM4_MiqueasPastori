import { describe, expect, it } from 'vitest'
import type { Task } from '../types/task.ts'
import { orderForNewTask, reorderTasks } from './taskOrder.ts'

function task(partial: Pick<Task, 'id' | 'title'> & Partial<Task>): Task {
  return {
    userId: 'u1',
    description: '',
    completed: false,
    dueDate: null,
    order: null,
    createdAt: null,
    ...partial,
  }
}

describe('orden de tareas', () => {
  it('guarda el nuevo orden después de mover una tarea', () => {
    const tasks = [
      task({ id: 'a', title: 'A', order: 0 }),
      task({ id: 'b', title: 'B', order: 1 }),
      task({ id: 'c', title: 'C', order: 2 }),
    ]

    expect(reorderTasks(tasks, 'a', 'c')).toEqual([
      { id: 'b', order: 0 },
      { id: 'c', order: 1 },
      { id: 'a', order: 2 },
    ])
  })

  it('ubica una tarea nueva según la fecha de vencimiento', () => {
    const tasks = [
      task({ id: 'soon', title: 'Pronto', dueDate: '2026-01-10', order: 0 }),
      task({ id: 'late', title: 'Tarde', dueDate: '2026-03-01', order: 1 }),
    ]

    expect(orderForNewTask(tasks, '2026-02-01')).toBe(0.5)
    expect(orderForNewTask([], '2026-02-01')).toBe(0)
  })
})
