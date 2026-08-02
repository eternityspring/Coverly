import { createError, getRequestURL, type H3Event } from 'h3'

export type AgentImageFit = 'cover' | 'contain' | 'fill'

export interface AgentImagePlacement {
  x?: number
  y?: number
  width?: number
  height?: number
  objectFit?: AgentImageFit
}

export interface AgentImageImport {
  id: string
  kind: 'image' | 'document'
  name: string
  dataUrl?: string
  document?: Record<string, unknown>
  placement?: AgentImagePlacement
  targetClientId?: string
  status: 'queued' | 'claimed' | 'consumed'
  createdAt: number
  claimedAt?: number
  consumedAt?: number
}

export interface AgentEditorSession {
  clientId: string
  documentName: string
  pageId: string
  visible: boolean
  focused: boolean
  updatedAt: number
}

interface AgentImageImportStore {
  items: AgentImageImport[]
  sessions: AgentEditorSession[]
}

const globalState = globalThis as typeof globalThis & {
  __coverlyAgentImageImports?: AgentImageImportStore
}

const store =
  globalState.__coverlyAgentImageImports ||
  (globalState.__coverlyAgentImageImports = { items: [], sessions: [] })

// Upgrade the development global in place when HMR preserved an older store.
store.sessions ||= []

const MAX_IMAGE_BYTES = 24 * 1024 * 1024
const MAX_PENDING = 8
const CLAIM_TIMEOUT_MS = 15_000
const RECORD_TTL_MS = 30 * 60_000
const SESSION_TTL_MS = 8_000
const ELEMENT_TYPES = new Set(['text', 'rect', 'ellipse', 'triangle', 'image', 'divider'])

export function assertLoopbackRequest(event: H3Event) {
  const address = event.node.req.socket.remoteAddress || ''
  const hostname = getRequestURL(event).hostname
  const isLoopbackAddress =
    address === '127.0.0.1' ||
    address === '::1' ||
    address.startsWith('::ffff:127.') ||
    address === '0:0:0:0:0:0:0:1'
  const isLoopbackHost = hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.')
  const mayUseHostFallback = process.env.NODE_ENV !== 'production' && isLoopbackHost

  // Nitro's Vercel-compatible dev adapter does not always expose remoteAddress,
  // so development also accepts a loopback Host. Production requires the
  // socket itself to be loopback, preventing Host-header spoofing.
  if (!isLoopbackAddress && !mayUseHostFallback) {
    throw createError({
      statusCode: 403,
      statusMessage: 'The agent image bridge only accepts requests from this machine.',
    })
  }
}

function prune(now = Date.now()) {
  store.items = store.items.filter((item) => now - item.createdAt < RECORD_TTL_MS)
  store.sessions = store.sessions.filter((session) => now - session.updatedAt < SESSION_TTL_MS)
}

function cleanOptionalNumber(value: unknown, field: string, min?: number) {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value) || (min !== undefined && value < min)) {
    throw createError({ statusCode: 400, statusMessage: `${field} must be a finite number${min !== undefined ? ` >= ${min}` : ''}.` })
  }
  return value
}

function cleanPlacement(value: unknown): AgentImagePlacement | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: 'placement must be an object.' })
  }

  const raw = value as Record<string, unknown>
  const objectFit = raw.objectFit
  if (objectFit !== undefined && !['cover', 'contain', 'fill'].includes(String(objectFit))) {
    throw createError({ statusCode: 400, statusMessage: 'placement.objectFit must be cover, contain, or fill.' })
  }

  return {
    x: cleanOptionalNumber(raw.x, 'placement.x'),
    y: cleanOptionalNumber(raw.y, 'placement.y'),
    width: cleanOptionalNumber(raw.width, 'placement.width', 1),
    height: cleanOptionalNumber(raw.height, 'placement.height', 1),
    objectFit: objectFit as AgentImageFit | undefined,
  }
}

function validateDataUrl(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'dataUrl is required.' })
  }

  const match = value.match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match) {
    throw createError({ statusCode: 400, statusMessage: 'Only base64 PNG, JPEG, WebP, and GIF images are supported.' })
  }

  const encoded = match[2]
  if (encoded.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) {
    throw createError({ statusCode: 413, statusMessage: 'Image exceeds the 24 MB bridge limit.' })
  }

  const bytes = Buffer.from(encoded, 'base64')
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: bytes.length ? 413 : 400, statusMessage: bytes.length ? 'Image exceeds the 24 MB bridge limit.' : 'Image is empty.' })
  }

  return value
}

function validateLayeredDocument(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: 'document must be an object.' })
  }
  const document = value as Record<string, unknown>
  const pages = document.pages
  if (!Array.isArray(pages) || !pages.length || pages.length > 20) {
    throw createError({ statusCode: 400, statusMessage: 'document.pages must contain 1 to 20 pages.' })
  }

  let elementCount = 0
  for (const page of pages) {
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      throw createError({ statusCode: 400, statusMessage: 'Each page must be an object.' })
    }
    const rawPage = page as Record<string, unknown>
    const artboard = rawPage.artboard as Record<string, unknown> | undefined
    const width = artboard?.width
    const height = artboard?.height
    if (
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1 ||
      width > 16_384 ||
      height > 16_384
    ) {
      throw createError({ statusCode: 400, statusMessage: 'Each page needs finite artboard dimensions from 1 to 16384 pixels.' })
    }

    const elements = rawPage.elements
    if (!Array.isArray(elements)) {
      throw createError({ statusCode: 400, statusMessage: 'Each page.elements must be an array.' })
    }
    elementCount += elements.length
    if (elementCount > 250) {
      throw createError({ statusCode: 400, statusMessage: 'A layered import supports at most 250 elements.' })
    }

    for (const element of elements) {
      if (!element || typeof element !== 'object' || Array.isArray(element)) {
        throw createError({ statusCode: 400, statusMessage: 'Each element must be an object.' })
      }
      const raw = element as Record<string, unknown>
      if (typeof raw.type !== 'string' || !ELEMENT_TYPES.has(raw.type)) {
        throw createError({ statusCode: 400, statusMessage: 'An element has an unsupported type.' })
      }
      for (const field of ['x', 'y', 'width', 'height']) {
        const number = raw[field]
        if (typeof number !== 'number' || !Number.isFinite(number) || ((field === 'width' || field === 'height') && number < 1)) {
          throw createError({ statusCode: 400, statusMessage: `Element ${field} must be a valid number.` })
        }
      }
      if (raw.type === 'image') validateDataUrl(raw.src)
      if (raw.type === 'text' && typeof raw.text !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Text elements require a text string.' })
      }
    }
  }
  return document
}

function cleanName(value: unknown, fallback: string) {
  return (
    (typeof value === 'string'
      ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120)
      : '') || fallback
  )
}

export function enqueueAgentImageImport(payload: Record<string, unknown>) {
  prune()
  const pending = store.items.filter((item) => item.status !== 'consumed').length
  if (pending >= MAX_PENDING) {
    throw createError({ statusCode: 429, statusMessage: 'The Coverly image import queue is full.' })
  }

  const document = payload.document === undefined ? undefined : validateLayeredDocument(payload.document)
  const targetClientId =
    typeof payload.targetClientId === 'string' && payload.targetClientId.trim()
      ? payload.targetClientId.trim().slice(0, 128)
      : undefined
  const name = cleanName(payload.name, document ? 'Layered Coverly design' : 'AI generated image')
  const item: AgentImageImport = {
    id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    kind: document ? 'document' : 'image',
    name,
    dataUrl: document ? undefined : validateDataUrl(payload.dataUrl),
    document,
    placement: document ? undefined : cleanPlacement(payload.placement),
    targetClientId,
    status: 'queued',
    createdAt: Date.now(),
  }
  store.items.push(item)
  return item
}

export function claimAgentImageImport(clientId = '') {
  const now = Date.now()
  prune(now)
  const item = store.items.find(
    (candidate) =>
      (!candidate.targetClientId || candidate.targetClientId === clientId) &&
      (candidate.status === 'queued' ||
        (candidate.status === 'claimed' && now - (candidate.claimedAt || 0) >= CLAIM_TIMEOUT_MS)),
  )
  if (!item) return null
  item.status = 'claimed'
  item.claimedAt = now
  return item
}

export function consumeAgentImageImport(id: string) {
  prune()
  const item = store.items.find((candidate) => candidate.id === id)
  if (!item) return false
  item.status = 'consumed'
  item.consumedAt = Date.now()
  item.dataUrl = undefined
  item.document = undefined
  return true
}

export function getAgentImageImportStatus(id: string) {
  prune()
  return store.items.find((candidate) => candidate.id === id)?.status || 'missing'
}

export function registerAgentEditorSession(payload: Record<string, unknown>) {
  prune()
  const clientId = typeof payload.clientId === 'string' ? payload.clientId.trim().slice(0, 128) : ''
  if (!clientId) throw createError({ statusCode: 400, statusMessage: 'clientId is required.' })
  const session: AgentEditorSession = {
    clientId,
    documentName: cleanName(payload.documentName, 'Untitled design'),
    pageId: typeof payload.pageId === 'string' ? payload.pageId.slice(0, 128) : '',
    visible: payload.visible === true,
    focused: payload.focused === true,
    updatedAt: Date.now(),
  }
  const index = store.sessions.findIndex((candidate) => candidate.clientId === clientId)
  if (index >= 0) store.sessions[index] = session
  else store.sessions.push(session)
  return session
}

export function listAgentEditorSessions() {
  prune()
  return [...store.sessions].sort((a, b) => b.updatedAt - a.updatedAt)
}
