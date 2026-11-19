import { describe, expect, it } from 'vitest'
import { buildTaskSummary } from './taskSummary.ts'

describe('buildTaskSummary', () => {
  it('cuenta completadas y pendientes y separa los títulos', () => {
    const summary = buildTaskSummary([
      { title: 'Comprar café', completed: true },
      { title: 'Estudiar', completed: false },
      { title: 'Cerrar el día', completed: false },
    ])

    expect(summary.subject).toBe('Resumen de tus tareas')

    const [completedBlock = '', pendingBlock = ''] = summary.text.split('\nPendientes:\n')
    expect(summary.text).toContain('Total: 3')
    expect(summary.text).toContain('Completadas: 1')
    expect(summary.text).toContain('Pendientes: 2')
    expect(completedBlock).toContain('- Comprar café')
    expect(completedBlock).not.toContain('- Estudiar')
    expect(pendingBlock).toContain('- Estudiar')
    expect(pendingBlock).toContain('- Cerrar el día')
  })

  it('arma un resumen vacío', () => {
    const summary = buildTaskSummary([])

    expect(summary.text).toContain('Total: 0')
    expect(summary.text).toContain('Completadas: 0')
    expect(summary.text).toContain('Pendientes: 0')
    expect(summary.text).toContain('- Ninguna')
  })
})
