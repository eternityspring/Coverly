/**
 * Seeds the `templates` table from the local private template file.
 *
 * Usage: npm run db:seed
 *
 * Reads `app/data/templates.local.ts` — the git-ignored file used during local
 * development — and upserts every template into the database. The blank canvas
 * is deliberately not seeded: it ships in the bundle so the editor still has a
 * template with no database.
 */
import postgres from 'postgres'

const LOCAL_TEMPLATES_PATH = 'app/data/templates.local.ts'

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set — nothing to seed.')
  process.exit(1)
}

// Imported directly — Node strips the types, and the file's only import is
// type-only so nothing from the app bundle is pulled in.
let mod: { LOCAL_TEMPLATES?: any[] }
try {
  mod = await import(new URL(`../${LOCAL_TEMPLATES_PATH}`, import.meta.url).href)
} catch {
  console.error(`${LOCAL_TEMPLATES_PATH} not found — nothing to seed.`)
  process.exit(1)
}

const list = mod.LOCAL_TEMPLATES ?? []
if (!list.length) {
  console.error(`No templates found in ${LOCAL_TEMPLATES_PATH}.`)
  process.exit(1)
}

const sql = postgres(url, { prepare: false })

for (const [i, t] of list.entries()) {
  await sql`
    insert into templates (id, name, description, kind, artboard, elements, page_seed, visibility, sort_order)
    values (
      ${t.id}, ${t.name}, ${t.desc ?? ''}, ${t.kind ?? 'cover'},
      ${sql.json(t.artboard)}, ${sql.json(t.elements ?? [])},
      ${t.pageSeed ? sql.json(t.pageSeed) : null},
      'public', ${i}
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      kind = excluded.kind,
      artboard = excluded.artboard,
      elements = excluded.elements,
      page_seed = excluded.page_seed,
      visibility = excluded.visibility,
      sort_order = excluded.sort_order,
      updated_at = now()
  `
  console.log(`seeded  ${t.id}  (${t.name})`)
}

await sql.end()
console.log(`\nDone — ${list.length} template(s) upserted.`)
