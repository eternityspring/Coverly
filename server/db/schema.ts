import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import type { Artboard, EditorElement, ElementType } from '../../app/types/editor'

// ---- Better Auth core tables ----
// Defined by hand rather than generated, so the schema stays readable and
// app-specific columns can be added later without a regeneration step.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// ---- App tables ----
// A template is a named artboard plus seed elements. The id is a slug, not a
// generated uuid: documents store it as `page.templateId` and look the template
// up by it, so it has to stay stable and human-readable.
export type TemplateElement = Partial<EditorElement> & { type: ElementType }

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  desc: text('description').notNull().default(''),
  kind: text('kind').notNull().default('cover'), // 'cover' | 'card'
  artboard: jsonb('artboard').$type<Artboard>().notNull(),
  elements: jsonb('elements').$type<TemplateElement[]>().notNull(),
  // Elements seeded into a page added after the first one; falls back to `elements`.
  pageSeed: jsonb('page_seed').$type<TemplateElement[]>(),
  // 'public'  — everyone, signed in or not
  // 'members' — only signed-in users
  visibility: text('visibility').notNull().default('public'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
