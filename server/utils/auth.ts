import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDb } from './db'
import * as schema from '../db/schema'

type Auth = ReturnType<typeof betterAuth>

let cached: Auth | null = null

/**
 * Built on first use rather than at import time, and `null` when there is no
 * database — without one there is nowhere to store users, so the whole user
 * system stays switched off and the editor carries on (see CLAUDE.md).
 */
export function useAuth(): Auth | null {
  if (cached) return cached
  const db = useDb()
  if (!db) return null

  const googleId = process.env.GOOGLE_CLIENT_ID
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET

  cached = betterAuth({
    baseURL: process.env.NUXT_PUBLIC_BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || [],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    // Google is optional — configured only when both credentials are present,
    // so a deployment without them still offers email + password.
    socialProviders:
      googleId && googleSecret
        ? { google: { clientId: googleId, clientSecret: googleSecret } }
        : {},
  })
  return cached
}
