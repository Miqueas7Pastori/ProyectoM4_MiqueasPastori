const taskErrorMessages: Record<string, string> = {
  'permission-denied': 'No tenés permiso para ver o modificar estas tareas.',
  'firestore/permission-denied': 'No tenés permiso para ver o modificar estas tareas.',
  unauthenticated: 'Tenés que iniciar sesión para ver tus tareas.',
  'not-found': 'La tarea no existe.',
  unavailable: 'No hay conexión con la base de datos. Probá de nuevo.',
  'app/firebase-not-configured':
    'Firebase no está configurado. Completá las variables VITE_FIREBASE_* en el archivo .env.',
}

const fallbackMessage = 'No se pudo guardar la tarea. Intentá de nuevo.'

export function getTaskErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return fallbackMessage
  }

  const { code } = error
  if (typeof code !== 'string') return fallbackMessage

  return taskErrorMessages[code] ?? fallbackMessage
}
