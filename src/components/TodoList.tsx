import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { filterTasks, type TaskFilter } from '../services/taskFilters.ts'
import { reorderTasks } from '../services/taskOrder.ts'
import { deleteTask, setTaskCompleted, updateTaskOrders } from '../services/tasks.ts'
import { getTaskErrorMessage } from '../services/taskErrors.ts'
import type { Task } from '../types/task.ts'
import { SendSummaryButton } from './SendSummaryButton.tsx'
import { TodoForm } from './TodoForm.tsx'

type TodoListProps = {
  userId: string
  tasks: Task[]
  loading: boolean
  error: string | null
}

export function TodoList({ userId, tasks, loading, error }: TodoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const visibleTasks = filterTasks(tasks, filter)
  const canReorder = filter === 'all' && editingId === null
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function runAction(taskId: string, action: () => Promise<void>) {
    setActionError(null)
    setPendingId(taskId)

    try {
      await action()
    } catch (caught) {
      setActionError(getTaskErrorMessage(caught))
    } finally {
      setPendingId(null)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const updates = reorderTasks(tasks, String(active.id), String(over.id)).filter((item) => {
      const current = tasks.find((task) => task.id === item.id)
      return current?.order !== item.order
    })
    if (updates.length === 0) return

    setActionError(null)
    try {
      await updateTaskOrders(updates)
    } catch (caught) {
      setActionError(getTaskErrorMessage(caught))
    }
  }

  function toggleLabel(task: Task) {
    return task.completed
      ? `Marcar ${task.title} como pendiente`
      : `Marcar ${task.title} como completada`
  }

  const list = (
    <ul className="task-list">
      {visibleTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          userId={userId}
          sortable={canReorder}
          editing={editingId === task.id}
          pending={pendingId === task.id}
          toggleLabel={toggleLabel(task)}
          onEdit={() => setEditingId(task.id)}
          onCancelEdit={() => setEditingId(null)}
          onToggle={() =>
            void runAction(task.id, () =>
              setTaskCompleted(
                task.id,
                {
                  userId: task.userId,
                  title: task.title,
                  description: task.description,
                  dueDate: task.dueDate,
                  order: task.order ?? 0,
                },
                !task.completed,
              ),
            )
          }
          onDelete={() => void runAction(task.id, () => deleteTask(task.id))}
        />
      ))}
    </ul>
  )

  return (
    <div className="task-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {!loading && !error && (
        <div className="task-filters" role="group" aria-label="Filtrar tareas">
          <FilterButton current={filter} value="all" onSelect={setFilter}>
            Todas
          </FilterButton>
          <FilterButton current={filter} value="pending" onSelect={setFilter}>
            Pendientes
          </FilterButton>
          <FilterButton current={filter} value="completed" onSelect={setFilter}>
            Completadas
          </FilterButton>
        </div>
      )}
      {loading ? (
        <p className="task-message" role="status">
          Cargando tareas...
        </p>
      ) : tasks.length === 0 && !error ? (
        <p className="task-message">Todavía no tenés tareas.</p>
      ) : visibleTasks.length === 0 && !error ? (
        <p className="task-message">
          {filter === 'pending' ? 'No hay tareas pendientes.' : 'No hay tareas completadas.'}
        </p>
      ) : canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
          <SortableContext items={visibleTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {list}
          </SortableContext>
        </DndContext>
      ) : (
        list
      )}
      <SendSummaryButton tasks={tasks} disabled={loading || error !== null} />
    </div>
  )
}

function TaskRow({
  task,
  userId,
  sortable,
  editing,
  pending,
  toggleLabel,
  onEdit,
  onCancelEdit,
  onToggle,
  onDelete,
}: {
  task: Task
  userId: string
  sortable: boolean
  editing: boolean
  pending: boolean
  toggleLabel: string
  onEdit: () => void
  onCancelEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  if (!sortable) {
    return (
      <li className={task.completed ? 'task task-done' : 'task'}>
        <TaskBody
          task={task}
          userId={userId}
          editing={editing}
          pending={pending}
          toggleLabel={toggleLabel}
          onEdit={onEdit}
          onCancelEdit={onCancelEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </li>
    )
  }

  return (
    <SortableTask
      task={task}
      userId={userId}
      editing={editing}
      pending={pending}
      toggleLabel={toggleLabel}
      onEdit={onEdit}
      onCancelEdit={onCancelEdit}
      onToggle={onToggle}
      onDelete={onDelete}
    />
  )
}

function SortableTask(props: {
  task: Task
  userId: string
  editing: boolean
  pending: boolean
  toggleLabel: string
  onEdit: () => void
  onCancelEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX}, ${transform.scaleY})`
      : undefined,
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={props.task.completed ? 'task task-done' : 'task'}
      data-dragging={isDragging || undefined}
    >
      <TaskBody {...props} dragHandle={{ attributes, listeners }} />
    </li>
  )
}

function TaskBody({
  task,
  userId,
  editing,
  pending,
  toggleLabel,
  onEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  dragHandle,
}: {
  task: Task
  userId: string
  editing: boolean
  pending: boolean
  toggleLabel: string
  onEdit: () => void
  onCancelEdit: () => void
  onToggle: () => void
  onDelete: () => void
  dragHandle?: {
    attributes: ReturnType<typeof useSortable>['attributes']
    listeners: ReturnType<typeof useSortable>['listeners']
  }
}) {
  if (editing) {
    return <TodoForm userId={userId} task={task} onDone={onCancelEdit} />
  }

  return (
    <>
      <div className="task-top">
        {dragHandle && (
          <button
            className="button button-small button-secondary drag-handle"
            type="button"
            aria-label={`Reordenar ${task.title}`}
            {...dragHandle.attributes}
            {...dragHandle.listeners}
          >
            Mover
          </button>
        )}
        <input
          type="checkbox"
          checked={task.completed}
          aria-label={toggleLabel}
          disabled={pending}
          onChange={onToggle}
        />
        <div className="task-main">
          <h3 className="task-title">{task.title}</h3>
          {task.dueDate && <p className="task-due">Vence el {formatDueDate(task.dueDate)}</p>}
          {task.description && <p className="task-description">{task.description}</p>}
        </div>
      </div>
      <div className="task-actions">
        <button
          className="button button-small button-secondary"
          type="button"
          aria-label={`Editar ${task.title}`}
          disabled={pending}
          onClick={onEdit}
        >
          Editar
        </button>
        <button
          className="button button-small button-danger"
          type="button"
          aria-label={`Eliminar ${task.title}`}
          disabled={pending}
          onClick={onDelete}
        >
          Eliminar
        </button>
      </div>
    </>
  )
}

function formatDueDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function FilterButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: TaskFilter
  value: TaskFilter
  onSelect: (filter: TaskFilter) => void
  children: string
}) {
  const selected = current === value

  return (
    <button
      className={selected ? 'button button-small' : 'button button-small button-secondary'}
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  )
}
