import test from 'node:test'
import assert from 'node:assert/strict'
import { isAdminIdentity } from '../server/utils/adminPolicy.ts'
const admin = { id: 'provisioned-id', email: 'eternityspring@gmail.com', emailVerified: true }
test('only the provisioned verified identity can administer users', () => {
  assert.equal(isAdminIdentity(admin, 'provisioned-id', admin.email), true)
  assert.equal(isAdminIdentity({ ...admin, id: 'signup-attacker' }, 'provisioned-id', admin.email), false)
  assert.equal(isAdminIdentity({ ...admin, emailVerified: false }, 'provisioned-id', admin.email), false)
  assert.equal(isAdminIdentity({ ...admin, email: 'another@example.com' }, 'provisioned-id', admin.email), false)
  assert.equal(isAdminIdentity(admin, '', admin.email), false)
  assert.equal(isAdminIdentity(null, 'provisioned-id', admin.email), false)
})
