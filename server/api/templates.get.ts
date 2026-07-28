import { inArray, asc } from 'drizzle-orm'
import { useDb } from '~~/server/utils/db'
import { getUser } from '~~/server/utils/session'
import { templates } from '~~/server/db/schema'

/**
 * Extra templates for the picker. Signed-in users additionally see the ones
 * marked `members`.
 *
 * Never fails the client: with no database — or a database that is down — this
 * returns an empty list, which the editor reads as "no extra templates" rather
 * than as an error (see CLAUDE.md).
 */
export default defineEventHandler(async (event) => {
  const db = useDb()
  if (!db) return []

  try {
    const user = await getUser(event)
    const visible = user ? ['public', 'members'] : ['public']

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
      .where(inArray(templates.visibility, visible))
      .orderBy(asc(templates.sortOrder), asc(templates.createdAt))

    return rows.map((r) => ({ ...r, pageSeed: r.pageSeed ?? undefined }))
  } catch (err) {
    console.error('[api/templates] failed to load templates', err)
    return []
  }
})
