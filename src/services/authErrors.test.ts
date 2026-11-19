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
  })
})
