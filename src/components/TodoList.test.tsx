import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteDoc, updateDoc } from 'firebase/firestore'
import type { Task } from '../types/task.ts'
import { TodoList } from './TodoList.tsx'

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

const ownTasks: Task[] = [
  {
    id: 'new',
    userId: 'u1',
    title: 'Más nueva',
    description: 'Primero',
    completed: false,
    dueDate: '2026-01-10',
    order: 0,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'old',
    userId: 'u1',
    title: 'Más vieja',
    description: '',
    completed: true,
    dueDate: '2026-02-01',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function renderList(tasks: Task[] = ownTasks, loading = false, error: string | null = null) {
  return render(<TodoList userId="u1" tasks={tasks} loading={loading} error={error} />)
}

describe('TodoList', () => {
  beforeEach(() => {
    vi.mocked(updateDoc).mockReset()
    vi.mocked(updateDoc).mockResolvedValue(undefined)
    vi.mocked(deleteDoc).mockReset()
    vi.mocked(deleteDoc).mockResolvedValue(undefined)
  })

  it('muestra las tareas en el orden guardado', async () => {
    renderList()

    const titles = (await screen.findAllByRole('heading', { level: 3 })).map(
      (heading) => heading.textContent,
    )

    expect(titles).toEqual(['Más nueva', 'Más vieja'])
    expect(screen.getByText('Primero')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Marcar Más vieja como pendiente' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Reordenar Más nueva' })).toBeInTheDocument()
  })

  it('marca una tarea como completada', async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByRole('checkbox', { name: 'Marcar Más nueva como completada' }))

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { path: 'tasks/new' },
        {
          userId: 'u1',
          title: 'Más nueva',
          description: 'Primero',
          completed: true,
          dueDate: '2026-01-10',
          order: 0,
        },
      )
    })
  })

  it('elimina una tarea', async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByRole('button', { name: 'Eliminar Más nueva' }))

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith({ path: 'tasks/new' })
    })
  })

  it('edita el título desde el listado', async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByRole('button', { name: 'Editar Más nueva' }))
    const title = screen.getByLabelText('Título')
    await user.clear(title)
    await user.type(title, 'Más nueva editada')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { path: 'tasks/new' },
        {
          userId: 'u1',
          title: 'Más nueva editada',
          description: 'Primero',
          completed: false,
          dueDate: '2026-01-10',
          order: 0,
        },
      )
    })
  })

  it('filtra pendientes y completadas', async () => {
    const user = userEvent.setup()
    renderList()

    expect(screen.getByRole('heading', { name: 'Más nueva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Más vieja' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pendientes' }))

    expect(screen.getByRole('heading', { name: 'Más nueva' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Más vieja' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reordenar Más nueva' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Completadas' }))

    expect(screen.queryByRole('heading', { name: 'Más nueva' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Más vieja' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Todas' }))

    expect(screen.getByRole('heading', { name: 'Más nueva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Más vieja' })).toBeInTheDocument()
  })

  it('muestra el estado vacío', () => {
    renderList([])

    expect(screen.getByText('Todavía no tenés tareas.')).toBeInTheDocument()
  })

  it('muestra el error de Firestore', () => {
    renderList([], false, 'No tenés permiso para ver o modificar estas tareas.')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No tenés permiso para ver o modificar estas tareas.',
    )
  })

  it('muestra la carga mientras Firestore no responde', () => {
    renderList([], true)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tareas...')
  })
})
