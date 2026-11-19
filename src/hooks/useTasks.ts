import { useEffect, useState } from 'react'
import { subscribeToTasks } from '../services/tasks.ts'
import type { Task } from '../types/task.ts'

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeToTasks(
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
  }, [userId])

  return { tasks, loading, error }
}
