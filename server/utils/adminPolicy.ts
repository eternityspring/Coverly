export interface AdminIdentity { id: string; email: string; emailVerified: boolean }

/** IDs are provisioned by the operator; registering an email cannot grant access. */
export function isAdminIdentity(user: AdminIdentity | null, ids: string, email: string): boolean {
  if (!user || !user.emailVerified) return false
  const allowedIds = ids.split(',').map((id) => id.trim()).filter(Boolean)
  return allowedIds.includes(user.id) && user.email.toLowerCase() === email.trim().toLowerCase()
}
