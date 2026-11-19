import { describe, expect, it } from 'vitest'
import { readVerifiedIdentity } from './verifyFirebaseIdToken.ts'

describe('readVerifiedIdentity', () => {
  it('acepta un token del proyecto y devuelve el email', () => {
    expect(
      readVerifiedIdentity(
        {
          aud: 'matecode',
          iss: 'https://securetoken.google.com/matecode',
          sub: 'user-1',
          email: 'ana@mail.com',
        },
        'matecode',
      ),
    ).toEqual({ uid: 'user-1', email: 'ana@mail.com' })
  })

  it('rechaza un token de otro proyecto', () => {
    expect(() =>
      readVerifiedIdentity(
        {
          aud: 'otro-proyecto',
          iss: 'https://securetoken.google.com/otro-proyecto',
          sub: 'user-1',
          email: 'ana@mail.com',
        },
        'matecode',
      ),
    ).toThrow('invalid-token')
  })
})
