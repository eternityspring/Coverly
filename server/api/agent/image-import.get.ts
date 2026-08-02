import { getQuery } from 'h3'
import {
  assertLoopbackRequest,
  claimAgentImageImport,
  getAgentImageImportStatus,
} from '../../utils/agentImageImports'

export default defineEventHandler((event) => {
  assertLoopbackRequest(event)
  const query = getQuery(event)
  const id = typeof query.id === 'string' ? query.id : ''
  if (id) return { id, status: getAgentImageImportStatus(id) }
  const clientId = typeof query.clientId === 'string' ? query.clientId : ''
  return { item: claimAgentImageImport(clientId) }
})
