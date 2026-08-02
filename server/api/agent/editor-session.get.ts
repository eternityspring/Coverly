import { assertLoopbackRequest, listAgentEditorSessions } from '../../utils/agentImageImports'

export default defineEventHandler((event) => {
  assertLoopbackRequest(event)
  return { sessions: listAgentEditorSessions() }
})
