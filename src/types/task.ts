export type Task = {
  id: string
  userId: string
  title: string
  description: string
  completed: boolean
  createdAt: string | null
}

export type TaskInput = {
  title: string
  description: string
}
