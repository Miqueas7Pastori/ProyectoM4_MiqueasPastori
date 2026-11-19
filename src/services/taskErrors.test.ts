import { describe, expect, it } from 'vitest'
import { getTaskErrorMessage } from './taskErrors.ts'

describe('getTaskErrorMessage', () => {
  it.each([
    ['permission-denied', 'No tenés permiso para ver o modificar estas tareas.'],
    ['firestore/permission-denied', 'No tenés permiso para ver o modificar estas tareas.'],
    ['unauthenticated', 'Tenés que iniciar sesión para ver tus tareas.'],
    ['not-found', 'La tarea no existe.'],
    ['unavailable', 'No hay conexión con la base de datos. Probá de nuevo.'],
    [
      'app/firebase-not-configured',
      'Firebase no está configurado. Completá las variables VITE_FIREBASE_* en el archivo .env.',
    ],
  ] as const)('traduce %s', (code, message) => {
    expect(getTaskErrorMessage({ code })).toBe(message)
  })

  it('usa un mensaje genérico si el error no es de Firestore', () => {
    expect(getTaskErrorMessage(new Error('falló'))).toBe(
      'No se pudo guardar la tarea. Intentá de nuevo.',
    )
    expect(getTaskErrorMessage({ code: 'desconocido' })).toBe(
      'No se pudo guardar la tarea. Intentá de nuevo.',
    )
    expect(getTaskErrorMessage(null)).toBe('No se pudo guardar la tarea. Intentá de nuevo.')
  })
})
