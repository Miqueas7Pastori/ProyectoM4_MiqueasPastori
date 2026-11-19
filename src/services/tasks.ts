import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Task, TaskInput } from '../types/task.ts'
import { db } from './firebase.ts'
import { getTaskErrorMessage } from './taskErrors.ts'
import { compareTasks } from './taskOrder.ts'

const tasksCollection = 'tasks'

function requireDb() {
  if (!db) {
    throw Object.assign(new Error('Firebase no está configurado.'), {
      code: 'app/firebase-not-configured',
    })
  }

  return db
}

function readCreatedAt(value: unknown): string | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    const date = value.toDate()
    return date instanceof Date ? date.toISOString() : null
  }

  return typeof value === 'string' ? value : null
}

function readDueDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function mapTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    completed: data.completed === true,
    dueDate: readDueDate(data.dueDate),
    order: typeof data.order === 'number' && Number.isFinite(data.order) ? data.order : null,
    createdAt: readCreatedAt(data.createdAt),
  }
}

export function subscribeToTasks(
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError: (message: string) => void,
): () => void {
  if (!db) {
    onError(getTaskErrorMessage({ code: 'app/firebase-not-configured' }))
    return () => {}
  }

  const tasksQuery = query(collection(db, tasksCollection), where('userId', '==', userId))

  return onSnapshot(
    tasksQuery,
    (snapshot) => {
      const tasks = snapshot.docs
        .map((item) => mapTask(item.id, item.data() as Record<string, unknown>))
        .filter((task) => task.userId === userId)
        .sort(compareTasks)

      onChange(tasks)
    },
    (error) => {
      onError(getTaskErrorMessage(error))
    },
  )
}

export async function createTask(userId: string, input: TaskInput): Promise<void> {
  await addDoc(collection(requireDb(), tasksCollection), {
    userId,
    title: input.title,
    description: input.description,
    completed: false,
    dueDate: input.dueDate,
    order: input.order,
    createdAt: serverTimestamp(),
  })
}

export async function updateTask(
  taskId: string,
  fields: {
    userId: string
    title: string
    description: string
    completed: boolean
    dueDate: string | null
    order: number
  },
): Promise<void> {
  await updateDoc(doc(requireDb(), tasksCollection, taskId), {
    userId: fields.userId,
    title: fields.title,
    description: fields.description,
    completed: fields.completed,
    dueDate: fields.dueDate,
    order: fields.order,
  })
}

export async function setTaskCompleted(
  taskId: string,
  fields: {
    userId: string
    title: string
    description: string
    dueDate: string | null
    order: number
  },
  completed: boolean,
): Promise<void> {
  await updateTask(taskId, { ...fields, completed })
}

export async function updateTaskOrders(updates: Array<{ id: string; order: number }>): Promise<void> {
  const database = requireDb()
  await Promise.all(updates.map(({ id, order }) => updateDoc(doc(database, tasksCollection, id), { order })))
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), tasksCollection, taskId))
}
