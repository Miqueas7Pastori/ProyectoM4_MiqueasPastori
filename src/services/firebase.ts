import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

function readConfig(): FirebaseOptions | null {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const complete = Object.values(config).every(
    (value) => typeof value === 'string' && value.length > 0,
  )

  return complete ? config : null
}

function createAuth(): Auth | null {
  const config = readConfig()
  if (!config) return null

  const app = getApps().length > 0 ? getApp() : initializeApp(config)
  return getAuth(app)
}

export const auth = createAuth()

export const isFirebaseConfigured = auth !== null
