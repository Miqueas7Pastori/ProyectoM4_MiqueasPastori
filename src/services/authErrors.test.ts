import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from './authErrors.ts'

describe('getAuthErrorMessage', () => {
  it('traduce el email en uso', () => {
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'Ese email ya está registrado.',
    )
  })

  it('traduce la contraseña incorrecta', () => {
    expect(getAuthErrorMessage({ code: 'auth/wrong-password' })).toBe(
      'La contraseña es incorrecta.',
    )
  })

  it('traduce la cuenta inexistente', () => {
    expect(getAuthErrorMessage({ code: 'auth/user-not-found' })).toBe(
      'No existe una cuenta con ese email.',
    )
  })

  it('traduce el error actual de Firebase cuando no distingue el motivo', () => {
    expect(getAuthErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Email o contraseña incorrectos.',
    )
  })

  it('usa un mensaje genérico si el código no es conocido', () => {
    expect(getAuthErrorMessage(new Error('falló'))).toBe(
      'No se pudo completar la operación. Intentá de nuevo.',
    )
    expect(getAuthErrorMessage({ code: 'auth/otro' })).toBe(
      'No se pudo completar la operación. Intentá de nuevo.',
    )
    expect(getAuthErrorMessage(null)).toBe('No se pudo completar la operación. Intentá de nuevo.')
  })

  it.each([
    ['auth/invalid-email', 'El email no es válido.'],
    ['auth/weak-password', 'La contraseña debe tener al menos 6 caracteres.'],
    ['auth/popup-closed-by-user', 'Se cerró la ventana de Google antes de terminar.'],
    ['auth/popup-blocked', 'El navegador bloqueó la ventana de Google.'],
    ['auth/too-many-requests', 'Demasiados intentos. Probá de nuevo más tarde.'],
    ['auth/network-request-failed', 'No hay conexión. Revisá tu red e intentá de nuevo.'],
    [
      'auth/account-exists-with-different-credential',
      'Ya existe una cuenta con ese email usando otro método de ingreso.',
    ],
    [
      'app/firebase-not-configured',
      'Firebase no está configurado. Completá las variables VITE_FIREBASE_* en el archivo .env.',
    ],
  ] as const)('traduce %s', (code, message) => {
    expect(getAuthErrorMessage({ code })).toBe(message)
  })
})
