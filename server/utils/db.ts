import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

export type Db = ReturnType<typeof createDb>

function createDb(url: string) {
  // prepare: false — required when the connection goes through a pooler
  return drizzle(postgres(url, { prepare: false }), { schema })
}

let cached: Db | null = null

/**
 * The database is optional (see CLAUDE.md): Coverly's editor works without it.
 * The connection is therefore opened on first use, never at import time, and
 * callers get `null` when DATABASE_URL is absent so they can degrade quietly.
 */
export function useDb(): Db | null {
  if (cached) return cached
  const url = process.env.DATABASE_URL
  if (!url) return null
  cached = createDb(url)
  return cached
}

export const hasDb = () => !!process.env.DATABASE_URL
