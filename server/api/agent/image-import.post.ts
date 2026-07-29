import { readBody } from 'h3'
import { assertLoopbackRequest, enqueueAgentImageImport } from '../../utils/agentImageImports'

export default defineEventHandler(async (event) => {
  assertLoopbackRequest(event)
  const body = await readBody<Record<string, unknown>>(event)
  const item = enqueueAgentImageImport(body || {})
  return { id: item.id, status: item.status }
})
