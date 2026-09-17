import { asc, count, desc, ilike, or } from 'drizzle-orm'
import { getQuery, createError } from 'h3'
import { requireAdmin, isAdmin } from '../../utils/admin'
import { useDb } from '../../utils/db'
import { user } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  if (!db) throw createError({ statusCode: 503, message: '用户管理暂不可用' })
  const query = getQuery(event)
  const pageText = String(query.page ?? '1')
  if (!/^[1-9]\d{0,5}$/.test(pageText)) throw createError({ statusCode: 400, message: '分页参数无效' })
  const page = Number(pageText)
  const search = String(query.search ?? '').trim()
  if (search.length > 100) throw createError({ statusCode: 400, message: '搜索内容不能超过 100 个字符' })
  const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`
  const where = search ? or(ilike(user.email, pattern), ilike(user.name, pattern)) : undefined
  const pageSize = 25
  const [rows, totals] = await Promise.all([
    db.select({ id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt })
      .from(user).where(where).orderBy(desc(user.createdAt), asc(user.id)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(user).where(where),
  ])
  return { users: rows.map((row) => ({ ...row, role: isAdmin(row) ? 'admin' : 'user' })), total: totals[0]?.total ?? 0, page, pageSize }
})
