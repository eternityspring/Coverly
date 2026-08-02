import { readBody } from 'h3'
import { assertLoopbackRequest, registerAgentEditorSession } from '../../utils/agentImageImports'

export default defineEventHandler(async (event) => {
  assertLoopbackRequest(event)
  const body = await readBody<Record<string, unknown>>(event)
  return { session: registerAgentEditorSession(body || {}) }
})
