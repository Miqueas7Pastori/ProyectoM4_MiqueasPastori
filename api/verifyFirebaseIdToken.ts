export type FirebaseIdentity = {
  uid: string
  email: string | null
}

type TokenClaims = {
  aud?: string
  iss?: string
  sub?: string
  email?: string
}

export function readVerifiedIdentity(claims: TokenClaims, projectId: string): FirebaseIdentity {
  const issuer = `https://securetoken.google.com/${projectId}`

  if (claims.aud !== projectId || claims.iss !== issuer || !claims.sub) {
    throw new Error('invalid-token')
  }

  return {
    uid: claims.sub,
    email: claims.email ?? null,
  }
}

export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
): Promise<FirebaseIdentity> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  )

  if (!response.ok) {
    throw new Error('invalid-token')
  }

  const claims = (await response.json()) as TokenClaims
  return readVerifiedIdentity(claims, projectId)
}
