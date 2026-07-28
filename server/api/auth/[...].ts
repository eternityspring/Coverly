import { useAuth } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  const auth = useAuth()
  // No database configured — the user system is off, not broken.
  if (!auth) throw createError({ statusCode: 404, message: 'Auth is not configured' })
  return auth.handler(toWebRequest(event))
})
