import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteDoc, onSnapshot, updateDoc, where } from 'firebase/firestore'
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

type FakeDoc = {
  id: string
  data: Record<string, unknown>
}

function emitTasks(docs: FakeDoc[]) {
  vi.mocked(onSnapshot).mockImplementation(((
    _query: unknown,
    onNext: (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void,
  ) => {
    onNext({
      docs: docs.map((item) => ({
        id: item.id,
        data: () => item.data,
      })),
    })
    return () => {}
  }) as never)
}

function timestamp(iso: string) {
  return { toDate: () => new Date(iso) }
}

const ownTasks: FakeDoc[] = [
  {
    id: 'new',
    data: {
      userId: 'u1',
      title: 'Más nueva',
      description: 'Primero',
      completed: false,
      createdAt: timestamp('2026-01-02T00:00:00.000Z'),
    },
  },
  {
    id: 'old',
    data: {
      userId: 'u1',
      title: 'Más vieja',
      description: '',
      completed: true,
      createdAt: timestamp('2026-01-01T00:00:00.000Z'),
    },
  },
  {
    id: 'other',
    data: {
      userId: 'u2',
      title: 'Ajena',
      description: 'No se muestra',
      completed: false,
      createdAt: timestamp('2026-01-03T00:00:00.000Z'),
    },
  },
]

describe('TodoList', () => {
  beforeEach(() => {
    vi.mocked(where).mockClear()
    vi.mocked(updateDoc).mockReset()
    vi.mocked(updateDoc).mockResolvedValue(undefined)
    vi.mocked(deleteDoc).mockReset()
    vi.mocked(deleteDoc).mockResolvedValue(undefined)
    vi.mocked(onSnapshot).mockReset()
    emitTasks([])
  })

  it('lista solo las tareas del usuario, de la más nueva a la más vieja', async () => {
    emitTasks(ownTasks)
    render(<TodoList userId="u1" />)

    const titles = (await screen.findAllByRole('heading', { level: 3 })).map(
      (heading) => heading.textContent,
    )

    expect(titles).toEqual(['Más nueva', 'Más vieja'])
    expect(screen.queryByText('Ajena')).not.toBeInTheDocument()
    expect(screen.getByText('Primero')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Marcar Más vieja como pendiente' })).toBeChecked()
    expect(where).toHaveBeenCalledWith('userId', '==', 'u1')
  })

  it('marca una tarea como completada', async () => {
    emitTasks(ownTasks)
    const user = userEvent.setup()
    render(<TodoList userId="u1" />)

    await user.click(
      await screen.findByRole('checkbox', { name: 'Marcar Más nueva como completada' }),
    )

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith({ path: 'tasks/new' }, { completed: true })
    })
  })

  it('elimina una tarea', async () => {
    emitTasks(ownTasks)
    const user = userEvent.setup()
    render(<TodoList userId="u1" />)

    await user.click(await screen.findByRole('button', { name: 'Eliminar Más nueva' }))

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith({ path: 'tasks/new' })
    })
  })

  it('edita el título desde el listado', async () => {
    emitTasks(ownTasks)
    const user = userEvent.setup()
    render(<TodoList userId="u1" />)

    await user.click(await screen.findByRole('button', { name: 'Editar Más nueva' }))
    const title = screen.getByLabelText('Título')
    await user.clear(title)
    await user.type(title, 'Más nueva editada')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { path: 'tasks/new' },
        { title: 'Más nueva editada', description: 'Primero' },
      )
    })
  })

  it('muestra el estado vacío', async () => {
    emitTasks([])
    render(<TodoList userId="u1" />)

    expect(await screen.findByText('Todavía no tenés tareas.')).toBeInTheDocument()
  })

  it('muestra el error de Firestore', async () => {
    vi.mocked(onSnapshot).mockImplementation(((
      _query: unknown,
      _onNext: unknown,
      onError: (error: { code: string }) => void,
    ) => {
      onError({ code: 'permission-denied' })
      return () => {}
    }) as never)

    render(<TodoList userId="u1" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso para ver o modificar estas tareas.',
    )
  })

  it('muestra la carga mientras Firestore no responde', () => {
    vi.mocked(onSnapshot).mockImplementation(() => () => {})
    render(<TodoList userId="u1" />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tareas...')
  })
})
