import { describe, expect, it } from 'vitest'
import type { Task } from '../types/task.ts'
import { filterTasks } from './taskFilters.ts'

const tasks: Task[] = [
  {
    id: '1',
    userId: 'u1',
    title: 'Pendiente',
    description: '',
    completed: false,
    dueDate: null,
    order: null,
    createdAt: null,
  },
  {
    id: '2',
    userId: 'u1',
    title: 'Lista',
    description: '',
    completed: true,
    dueDate: '2026-11-20',
    order: 1,
    createdAt: null,
  },
]

describe('filterTasks', () => {
  it('separa todas, pendientes y completadas', () => {
    expect(filterTasks(tasks, 'all').map((task) => task.title)).toEqual(['Pendiente', 'Lista'])
    expect(filterTasks(tasks, 'pending').map((task) => task.title)).toEqual(['Pendiente'])
    expect(filterTasks(tasks, 'completed').map((task) => task.title)).toEqual(['Lista'])
  })
})
