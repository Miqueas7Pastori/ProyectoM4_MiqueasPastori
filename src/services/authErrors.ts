const authErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Ese email ya está registrado.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google.',
  'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo más tarde.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu red e intentá de nuevo.',
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con ese email usando otro método de ingreso.',
  'app/firebase-not-configured':
    'Firebase no está configurado. Completá las variables VITE_FIREBASE_* en el archivo .env.',
}

const fallbackMessage = 'No se pudo completar la operación. Intentá de nuevo.'

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return fallbackMessage
  }

  const { code } = error
  if (typeof code !== 'string') return fallbackMessage

  return authErrorMessages[code] ?? fallbackMessage
}
