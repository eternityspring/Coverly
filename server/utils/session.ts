import type { H3Event } from 'h3'
import { useAuth } from './auth'

/** Current user, or null when signed out — or when auth isn't configured at all. */
export async function getUser(event: H3Event) {
  const auth = useAuth()
  if (!auth) return null
  const session = await auth.api.getSession({ headers: event.headers })
  return session?.user ?? null
}
