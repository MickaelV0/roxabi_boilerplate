import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { DefaultRoleException } from '../exceptions/defaultRole.exception.js'
import { MemberNotFoundException } from '../exceptions/memberNotFound.exception.js'
import { OwnershipConstraintException } from '../exceptions/ownershipConstraint.exception.js'
import { RoleNotFoundException } from '../exceptions/roleNotFound.exception.js'
import { RoleSlugConflictException } from '../exceptions/roleSlugConflict.exception.js'
import { RbacExceptionFilter } from './rbacException.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost() {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = { url: '/rbac/roles/r-123' }
  const response = { status: statusFn, header: headerFn }

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }

  const getSentBody = () => {
    const call = sendFn.mock.calls[0]
    expect(call).toBeDefined()
    return call?.[0] as Record<string, unknown>
  }

  return { host, statusFn, headerFn, getSentBody } as const
}

describe('RbacExceptionFilter', () => {
  const cls = createMockCls()
  const filter = new RbacExceptionFilter(cls as never)

  it('should return 404 for RoleNotFoundException', () => {
    const { host, statusFn } = createMockHost()
    filter.catch(new RoleNotFoundException('r-123'), host as never)
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return 400 for OwnershipConstraintException', () => {
    const { host, statusFn } = createMockHost()
    filter.catch(new OwnershipConstraintException('Cannot delete'), host as never)
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should include structured error body with message and errorCode', () => {
    const { host, getSentBody } = createMockHost()
    filter.catch(new RoleNotFoundException('r-456'), host as never)
    const body = getSentBody()
    expect(body.statusCode).toBe(404)
    expect(body.path).toBe('/rbac/roles/r-123')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('Role r-456 not found')
    expect(body.errorCode).toBe('ROLE_NOT_FOUND')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should include correct errorCode for each exception type', () => {
    const cases = [
      { exception: new RoleNotFoundException('r-1'), expectedCode: 'ROLE_NOT_FOUND' },
      { exception: new RoleSlugConflictException('admin'), expectedCode: 'ROLE_SLUG_CONFLICT' },
      {
        exception: new DefaultRoleException('Cannot delete'),
        expectedCode: 'DEFAULT_ROLE_CONSTRAINT',
      },
      {
        exception: new OwnershipConstraintException('Not allowed'),
        expectedCode: 'OWNERSHIP_CONSTRAINT',
      },
      { exception: new MemberNotFoundException('m-1'), expectedCode: 'MEMBER_NOT_FOUND' },
    ]

    for (const { exception, expectedCode } of cases) {
      const { host, getSentBody } = createMockHost()
      filter.catch(exception, host as never)
      expect(getSentBody().errorCode).toBe(expectedCode)
    }
  })

  it('should return 409 for RoleSlugConflictException', () => {
    const { host, statusFn } = createMockHost()
    filter.catch(new RoleSlugConflictException('admin'), host as never)
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT)
  })

  it('should return 400 for DefaultRoleException', () => {
    const { host, statusFn } = createMockHost()
    filter.catch(new DefaultRoleException('Cannot delete a default role'), host as never)
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 404 for MemberNotFoundException', () => {
    const { host, statusFn } = createMockHost()
    filter.catch(new MemberNotFoundException('m-123'), host as never)
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should set x-correlation-id header', () => {
    const { host, headerFn } = createMockHost()
    filter.catch(new RoleNotFoundException('r-1'), host as never)
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })
})
