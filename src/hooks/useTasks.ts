import { useEffect, useState } from 'react'
import { auth } from '../services/firebase.ts'
import { subscribeToTasks } from '../services/tasks.ts'
import type { Task } from '../types/task.ts'

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    let unsubscribe = () => {}

    async function start() {
      if (auth) {
        await auth.authStateReady()
        if (auth.currentUser?.uid === userId) {
          await auth.currentUser.getIdToken()
        }
      }

      if (cancel) return

      unsubscribe = subscribeToTasks(
        userId,
        (nextTasks) => {
          setTasks(nextTasks)
          setError(null)
          setLoading(false)
        },
        (message) => {
          setError(message)
          setLoading(false)
        },
      )
    }

    void start()

    return () => {
      cancel = true
      unsubscribe()
    }
  }, [userId])

  return { tasks, loading, error }
}
