import { createError, readBody } from 'h3'
import { assertLoopbackRequest, consumeAgentImageImport } from '../../utils/agentImageImports'

export default defineEventHandler(async (event) => {
  assertLoopbackRequest(event)
  const body = await readBody<{ id?: unknown }>(event)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required.' })
  if (!consumeAgentImageImport(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Image import was not found.' })
  }
  return { id, status: 'consumed' as const }
})
