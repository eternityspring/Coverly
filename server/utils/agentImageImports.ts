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
  name: string
  dataUrl: string
  placement?: AgentImagePlacement
  status: 'queued' | 'claimed' | 'consumed'
  createdAt: number
  claimedAt?: number
  consumedAt?: number
}

interface AgentImageImportStore {
  items: AgentImageImport[]
}

const globalState = globalThis as typeof globalThis & {
  __coverlyAgentImageImports?: AgentImageImportStore
}

const store =
  globalState.__coverlyAgentImageImports ||
  (globalState.__coverlyAgentImageImports = { items: [] })

const MAX_IMAGE_BYTES = 24 * 1024 * 1024
const MAX_PENDING = 8
const CLAIM_TIMEOUT_MS = 15_000
const RECORD_TTL_MS = 30 * 60_000

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

export function enqueueAgentImageImport(payload: Record<string, unknown>) {
  prune()
  const pending = store.items.filter((item) => item.status !== 'consumed').length
  if (pending >= MAX_PENDING) {
    throw createError({ statusCode: 429, statusMessage: 'The Coverly image import queue is full.' })
  }

  const name =
    (typeof payload.name === 'string'
      ? payload.name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120)
      : '') || 'AI generated image'
  const item: AgentImageImport = {
    id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    dataUrl: validateDataUrl(payload.dataUrl),
    placement: cleanPlacement(payload.placement),
    status: 'queued',
    createdAt: Date.now(),
  }
  store.items.push(item)
  return item
}

export function claimAgentImageImport() {
  const now = Date.now()
  prune(now)
  const item = store.items.find(
    (candidate) =>
      candidate.status === 'queued' ||
      (candidate.status === 'claimed' && now - (candidate.claimedAt || 0) >= CLAIM_TIMEOUT_MS),
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
  item.dataUrl = ''
  return true
}

export function getAgentImageImportStatus(id: string) {
  prune()
  return store.items.find((candidate) => candidate.id === id)?.status || 'missing'
}
