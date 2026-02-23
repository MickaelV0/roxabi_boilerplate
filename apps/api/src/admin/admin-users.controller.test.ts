import { describe, it } from 'vitest'

describe('AdminUsersController', () => {
  describe('GET /api/admin/users', () => {
    it('should return 403 for non-superadmin requests', () => {
      // TODO: implement — SC: "Non-superadmin requests return 403"
    })

    it('should return cursor-paginated users for superadmin', () => {
      // TODO: implement
    })

    it('should pass filter params to service', () => {
      // TODO: implement
    })
  })

  describe('GET /api/admin/users/:userId', () => {
    it('should return user detail for valid UUID', () => {
      // TODO: implement
    })

    it('should return 404 for unknown user', () => {
      // TODO: implement
    })
  })

  describe('PATCH /api/admin/users/:userId', () => {
    it('should validate request body with Zod', () => {
      // TODO: implement
    })

    it('should return 409 on email conflict', () => {
      // TODO: implement — SC: "PATCH with duplicate email returns 409"
    })
  })

  describe('POST /api/admin/users/:userId/ban', () => {
    it('should validate ban reason length (5-500 chars)', () => {
      // TODO: implement — SC: "Ban reason shorter than 5 chars or longer than 500 chars returns 400"
    })

    it('should ban user successfully', () => {
      // TODO: implement
    })
  })

  describe('POST /api/admin/users/:userId/unban', () => {
    it('should unban user successfully', () => {
      // TODO: implement
    })
  })

  describe('DELETE /api/admin/users/:userId', () => {
    it('should return 204 on successful soft-delete', () => {
      // TODO: implement
    })
  })

  describe('POST /api/admin/users/:userId/restore', () => {
    it('should restore user successfully', () => {
      // TODO: implement
    })
  })

  it('should use @Roles(superadmin) and @SkipOrg() on all endpoints', () => {
    // TODO: implement — SC: "All Phase 2 endpoints use @Roles(superadmin) with @SkipOrg()"
  })
})
