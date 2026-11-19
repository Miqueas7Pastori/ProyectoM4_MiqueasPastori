import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addDoc, updateDoc } from 'firebase/firestore'
import type { Task } from '../types/task.ts'
import { TodoForm } from './TodoForm.tsx'

vi.mock('../services/firebase.ts', () => ({
  db: { name: 'test-db' },
  auth: null,
  isFirebaseConfigured: true,
}))

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(() => ({ path: 'tasks' })),
  doc: vi.fn((_db: unknown, collectionName: string, id: string) => ({
    path: `${collectionName}/${id}`,
  })),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn(() => ({ path: 'query' })),
  where: vi.fn(() => 'where'),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}))

const existing: Task = {
  id: 'task-1',
  userId: 'u1',
  title: 'Estudiar',
  description: 'Repasar Firestore',
  completed: false,
  dueDate: '2026-03-01',
  order: 0,
  createdAt: '2026-01-02T00:00:00.000Z',
}

describe('TodoForm', () => {
  beforeEach(() => {
    vi.mocked(addDoc).mockReset()
    vi.mocked(addDoc).mockResolvedValue({ id: 'new-task' } as never)
    vi.mocked(updateDoc).mockReset()
    vi.mocked(updateDoc).mockResolvedValue(undefined)
  })

  it('no crea una tarea si el título está vacío', async () => {
    const user = userEvent.setup()
    render(<TodoForm userId="u1" />)

    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El título es obligatorio.')
    expect(addDoc).not.toHaveBeenCalled()
  })

  it('crea la tarea del usuario en Firestore', async () => {
    const user = userEvent.setup()
    render(<TodoForm userId="u1" />)

    await user.type(screen.getByLabelText('Título'), 'Comprar café')
    await user.type(screen.getByLabelText('Descripción'), 'En el centro')
    fireEvent.change(screen.getByLabelText('Vencimiento'), { target: { value: '2026-11-20' } })
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        { path: 'tasks' },
        {
          userId: 'u1',
          title: 'Comprar café',
          description: 'En el centro',
          completed: false,
          dueDate: '2026-11-20',
          order: 0,
          createdAt: 'server-timestamp',
        },
      )
    })
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText('Descripción')).toHaveValue('')
    expect(screen.getByLabelText('Vencimiento')).toHaveValue('')
  })

  it('guarda los cambios de una tarea existente', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<TodoForm userId="u1" task={existing} onDone={onDone} />)

    const title = screen.getByLabelText('Título')
    await user.clear(title)
    await user.type(title, 'Estudiar reglas')
    fireEvent.change(screen.getByLabelText('Vencimiento'), { target: { value: '2026-04-02' } })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { path: 'tasks/task-1' },
        {
          userId: 'u1',
          title: 'Estudiar reglas',
          description: 'Repasar Firestore',
          completed: false,
          dueDate: '2026-04-02',
          order: 0,
        },
      )
    })
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('muestra el error si Firestore rechaza el alta', async () => {
    vi.mocked(addDoc).mockRejectedValue({ code: 'permission-denied' })
    const user = userEvent.setup()
    render(<TodoForm userId="u1" />)

    await user.type(screen.getByLabelText('Título'), 'Comprar café')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso para ver o modificar estas tareas.',
    )
  })
})
