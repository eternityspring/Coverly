import { asc } from 'drizzle-orm'
import { useDb } from '~~/server/utils/db'
import { templates } from '~~/server/db/schema'

/**
 * Extra templates for the picker — every one of them, signed in or not. Browsing
 * and editing are open; signing in is only asked for at export.
 *
 * Never fails the client: with no database — or a database that is down — this
 * returns an empty list, which the editor reads as "no extra templates" rather
 * than as an error (see CLAUDE.md).
 */
export default defineEventHandler(async () => {
  const db = useDb()
  if (!db) return []

  try {
    const rows = await db
      .select({
        id: templates.id,
        name: templates.name,
        desc: templates.desc,
        kind: templates.kind,
        artboard: templates.artboard,
        elements: templates.elements,
        pageSeed: templates.pageSeed,
      })
      .from(templates)
      .orderBy(asc(templates.sortOrder), asc(templates.createdAt))

    return rows.map((r) => ({ ...r, pageSeed: r.pageSeed ?? undefined }))
  } catch (err) {
    console.error('[api/templates] failed to load templates', err)
    return []
  }
})
