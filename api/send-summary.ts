import { SESClient } from '@aws-sdk/client-ses'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { sendTaskSummaryEmail } from './sendTaskSummaryEmail.ts'
import type { SummaryTask } from './taskSummary.ts'
import { verifyFirebaseIdToken } from './verifyFirebaseIdToken.ts'

type NodeRequest = IncomingMessage & { body?: unknown }

const sendError = 'No se pudo enviar el resumen. Intentá de nuevo.'
const configError = 'Falta configurar el envío de email en el servidor.'

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function header(req: NodeRequest, name: string) {
  const value = req.headers[name]
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function readBearer(req: NodeRequest) {
  const value = header(req, 'authorization')
  if (!value?.startsWith('Bearer ')) return null
  const token = value.slice('Bearer '.length).trim()
  return token || null
}

async function readBody(req: NodeRequest): Promise<unknown> {
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {}
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8')
    return raw ? JSON.parse(raw) : {}
  }
  if (req.body !== undefined) return req.body

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function parseTasks(value: unknown): SummaryTask[] | null {
  if (!value || typeof value !== 'object' || !('tasks' in value)) return null
  const { tasks } = value
  if (!Array.isArray(tasks) || tasks.length > 200) return null

  const parsed: SummaryTask[] = []
  for (const item of tasks) {
    if (!item || typeof item !== 'object' || !('title' in item) || !('completed' in item)) {
      return null
    }
    const { title, completed } = item
    if (typeof title !== 'string' || typeof completed !== 'boolean') return null
    const normalized = title.replace(/\s+/g, ' ').trim()
    if (!normalized || normalized.length > 120) return null
    parsed.push({ title: normalized, completed })
  }

  return parsed
}

function readServerConfig() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()
  const region = process.env.AWS_REGION?.trim()
  const from = process.env.AWS_SES_FROM_EMAIL?.trim()
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)?.trim()

  if (!accessKeyId || !secretAccessKey || !region || !from || !projectId) return null

  return { accessKeyId, secretAccessKey, region, from, projectId }
}

export default async function handler(req: NodeRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método no permitido.' })
    return
  }

  const token = readBearer(req)
  if (!token) {
    sendJson(res, 401, { error: 'Tenés que iniciar sesión para enviar el resumen.' })
    return
  }

  const config = readServerConfig()
  if (!config) {
    sendJson(res, 500, { error: configError })
    return
  }

  let tasks: SummaryTask[] | null
  try {
    tasks = parseTasks(await readBody(req))
  } catch {
    sendJson(res, 400, { error: 'No se pudo armar el resumen de las tareas.' })
    return
  }

  if (!tasks) {
    sendJson(res, 400, { error: 'No se pudo armar el resumen de las tareas.' })
    return
  }

  let email: string | null
  try {
    const identity = await verifyFirebaseIdToken(token, config.projectId)
    email = identity.email
  } catch {
    sendJson(res, 401, { error: 'Tenés que iniciar sesión para enviar el resumen.' })
    return
  }

  if (!email) {
    sendJson(res, 400, { error: 'Tu cuenta no tiene un email para recibir el resumen.' })
    return
  }

  try {
    const client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    await sendTaskSummaryEmail(client, { from: config.from, to: email, tasks })
  } catch {
    sendJson(res, 502, { error: sendError })
    return
  }

  sendJson(res, 200, { ok: true })
}
