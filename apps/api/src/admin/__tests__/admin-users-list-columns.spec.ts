import { describe, expect, it } from 'vitest'

/**
 * Test shells for #312 — Users list columns (Orgs count + Last Active).
 * Spec: specs/312-313-admin-users-columns-org-membership-editing.mdx
 */
describe('AdminUsersService — listUsers columns (#312)', () => {
  // SC: /admin/users table shows "Orgs" column with count badge for each user.
  // Users in 0 orgs show "0".
  it('should return organizationCount derived from memberships for each user', () => {
    // TODO: implement — verify listUsers returns organizationCount field
    expect(true).toBe(false)
  })

  // SC: /admin/users table shows "Last Active" column with relative timestamp.
  // Uses MAX(timestamp) from audit_logs grouped by actorId.
  it('should return lastActive ISO timestamp from batch audit query', () => {
    // TODO: implement — verify listUsers returns lastActive field
    expect(true).toBe(false)
  })

  // SC: Users with no audit activity show "Never" (null lastActive).
  it('should return null lastActive for users with no audit entries', () => {
    // TODO: implement — verify users without audit logs get lastActive: null
    expect(true).toBe(false)
  })
})
