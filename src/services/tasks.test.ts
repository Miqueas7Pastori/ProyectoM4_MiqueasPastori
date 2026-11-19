import { addDoc, deleteDoc, onSnapshot, updateDoc, where } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTask,
  deleteTask,
  setTaskCompleted,
  subscribeToTasks,
  updateTask,
} from './tasks.ts'

vi.mock('./firebase.ts', () => ({
  db: { name: 'test-db' },
  auth: null,
  isFirebaseConfigured: true,
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
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

describe('tareas', () => {
  beforeEach(() => {
    vi.mocked(addDoc).mockReset()
    vi.mocked(addDoc).mockResolvedValue({ id: 'nueva' } as never)
    vi.mocked(updateDoc).mockReset()
    vi.mocked(updateDoc).mockResolvedValue(undefined)
    vi.mocked(deleteDoc).mockReset()
    vi.mocked(deleteDoc).mockResolvedValue(undefined)
    vi.mocked(where).mockClear()
    vi.mocked(onSnapshot).mockReset()
  })

  it('guarda una tarea nueva solo con el usuario indicado', async () => {
    await createTask('u1', {
      title: 'Comprar café',
      description: 'En el centro',
      dueDate: '2026-11-20',
    })

    expect(addDoc).toHaveBeenCalledWith(
      { path: 'tasks' },
      {
        userId: 'u1',
        title: 'Comprar café',
        description: 'En el centro',
        completed: false,
        dueDate: '2026-11-20',
        createdAt: 'server-timestamp',
      },
    )
  })

  it('actualiza título y descripción sin cambiar el dueño', async () => {
    await updateTask('task-1', {
      userId: 'u1',
      title: 'Estudiar',
      description: 'Reglas',
      completed: false,
      dueDate: '2026-12-01',
    })

    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'tasks/task-1' },
      {
        userId: 'u1',
        title: 'Estudiar',
        description: 'Reglas',
        completed: false,
        dueDate: '2026-12-01',
      },
    )
  })

  it('marca una tarea como completada', async () => {
    await setTaskCompleted(
      'task-1',
      { userId: 'u1', title: 'Estudiar', description: 'Reglas', dueDate: '2026-12-01' },
      true,
    )

    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'tasks/task-1' },
      {
        userId: 'u1',
        title: 'Estudiar',
        description: 'Reglas',
        completed: true,
        dueDate: '2026-12-01',
      },
    )
  })

  it('elimina una tarea', async () => {
    await deleteTask('task-1')

    expect(deleteDoc).toHaveBeenCalledWith({ path: 'tasks/task-1' })
  })

  it('lista solo las tareas del usuario y las ordena por vencimiento', () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    vi.mocked(onSnapshot).mockImplementation(((
      _query: unknown,
      onNext: (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void,
    ) => {
      onNext({
        docs: [
          {
            id: 'late',
            data: () => ({
              userId: 'u1',
              title: 'Tarde',
              description: '',
              completed: false,
              dueDate: '2026-03-01',
              createdAt: '2026-01-01T00:00:00.000Z',
            }),
          },
          {
            id: 'soon',
            data: () => ({
              userId: 'u1',
              title: 'Pronto',
              description: 'Detalle',
              completed: true,
              dueDate: '2026-01-20',
              createdAt: { toDate: () => new Date('2026-03-01T00:00:00.000Z') },
            }),
          },
          {
            id: 'open',
            data: () => ({
              userId: 'u1',
              title: 'Sin fecha',
              description: '',
              completed: false,
              createdAt: '2026-04-01T00:00:00.000Z',
            }),
          },
          {
            id: 'other',
            data: () => ({
              userId: 'u2',
              title: 'Ajena',
              description: '',
              completed: false,
              dueDate: '2026-01-01',
              createdAt: '2026-04-01T00:00:00.000Z',
            }),
          },
        ],
      })
      return () => {}
    }) as never)

    subscribeToTasks('u1', onChange, onError)

    expect(where).toHaveBeenCalledWith('userId', '==', 'u1')
    expect(onError).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith([
      {
        id: 'soon',
        userId: 'u1',
        title: 'Pronto',
        description: 'Detalle',
        completed: true,
        dueDate: '2026-01-20',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'late',
        userId: 'u1',
        title: 'Tarde',
        description: '',
        completed: false,
        dueDate: '2026-03-01',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'open',
        userId: 'u1',
        title: 'Sin fecha',
        description: '',
        completed: false,
        dueDate: null,
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ])
  })

  it('traduce el error de la suscripción', () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    vi.mocked(onSnapshot).mockImplementation(((
      _query: unknown,
      _onNext: unknown,
      onSnapshotError: (error: { code: string }) => void,
    ) => {
      onSnapshotError({ code: 'unavailable' })
      return () => {}
    }) as never)

    subscribeToTasks('u1', onChange, onError)

    expect(onChange).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('No hay conexión con la base de datos. Probá de nuevo.')
  })
})
