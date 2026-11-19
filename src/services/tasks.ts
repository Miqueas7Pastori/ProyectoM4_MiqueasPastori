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

function mapTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    completed: data.completed === true,
    createdAt: readCreatedAt(data.createdAt),
  }
}

function byNewest(a: Task, b: Task) {
  const aTime = a.createdAt ? Date.parse(a.createdAt) : Number.POSITIVE_INFINITY
  const bTime = b.createdAt ? Date.parse(b.createdAt) : Number.POSITIVE_INFINITY
  return bTime - aTime
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
        .sort(byNewest)

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
    createdAt: serverTimestamp(),
  })
}

export async function updateTask(
  taskId: string,
  fields: { userId: string; title: string; description: string; completed: boolean },
): Promise<void> {
  await updateDoc(doc(requireDb(), tasksCollection, taskId), {
    userId: fields.userId,
    title: fields.title,
    description: fields.description,
    completed: fields.completed,
  })
}

export async function setTaskCompleted(
  taskId: string,
  fields: { userId: string; title: string; description: string },
  completed: boolean,
): Promise<void> {
  await updateTask(taskId, { ...fields, completed })
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), tasksCollection, taskId))
}
