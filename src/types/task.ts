export type Task = {
  id: string
  userId: string
  title: string
  description: string
  completed: boolean
  dueDate: string | null
  order: number | null
  createdAt: string | null
}

export type TaskInput = {
  title: string
  description: string
  dueDate: string | null
  order: number
}
