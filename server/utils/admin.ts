import { createError, setHeader, type H3Event } from 'h3'
import { getUser } from './session'
import { isAdminIdentity } from './adminPolicy'

export function isAdmin(user: Parameters<typeof isAdminIdentity>[0]) {
  return isAdminIdentity(user, process.env.ADMIN_USER_IDS || '', process.env.ADMIN_EMAIL || '')
}

export async function requireAdmin(event: H3Event) {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const user = await getUser(event)
  if (!user) throw createError({ statusCode: 401, message: '请先登录' })
  if (!isAdmin(user)) throw createError({ statusCode: 403, message: '仅管理员可以访问' })
  return user
}
