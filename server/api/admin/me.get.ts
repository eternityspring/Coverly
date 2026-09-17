import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  return { isAdmin: true, user: { id: user.id, name: user.name, email: user.email } }
})
