import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { EmailConflictException } from '../exceptions/email-conflict.exception.js'
import { InvitationAlreadyPendingException } from '../exceptions/invitation-already-pending.exception.js'
import { InvitationNotFoundException } from '../exceptions/invitation-not-found.exception.js'
import { LastOwnerConstraintException } from '../exceptions/last-owner-constraint.exception.js'
import { MemberAlreadyExistsException } from '../exceptions/member-already-exists.exception.js'
import { AdminMemberNotFoundException } from '../exceptions/member-not-found.exception.js'
import { OrgCycleDetectedException } from '../exceptions/org-cycle-detected.exception.js'
import { OrgDepthExceededException } from '../exceptions/org-depth-exceeded.exception.js'
import { AdminOrgNotFoundException } from '../exceptions/org-not-found.exception.js'
import { OrgSlugConflictException } from '../exceptions/org-slug-conflict.exception.js'
import { AdminRoleNotFoundException } from '../exceptions/role-not-found.exception.js'
import { SelfActionException } from '../exceptions/self-action.exception.js'
import { SelfRemovalException } from '../exceptions/self-removal.exception.js'
import { SelfRoleChangeException } from '../exceptions/self-role-change.exception.js'
import { UserAlreadyBannedException } from '../exceptions/user-already-banned.exception.js'
import { AdminUserNotFoundException } from '../exceptions/user-not-found.exception.js'
import { AdminExceptionFilter } from './admin-exception.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost(requestOverrides: Record<string, unknown> = {}) {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = { url: '/admin/members', ...requestOverrides }
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

describe('AdminExceptionFilter', () => {
  const cls = createMockCls()
  const filter = new AdminExceptionFilter(cls as never)

  it('should return 404 for AdminMemberNotFoundException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new AdminMemberNotFoundException('m-123')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return 404 for AdminRoleNotFoundException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new AdminRoleNotFoundException('r-456')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return 409 for MemberAlreadyExistsException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new MemberAlreadyExistsException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT)
  })

  it('should return 409 for InvitationAlreadyPendingException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new InvitationAlreadyPendingException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT)
  })

  it('should return 400 for LastOwnerConstraintException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new LastOwnerConstraintException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 for SelfRemovalException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new SelfRemovalException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 for SelfRoleChangeException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new SelfRoleChangeException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 for SelfActionException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new SelfActionException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 for UserAlreadyBannedException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new UserAlreadyBannedException('u-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 for OrgDepthExceededException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgDepthExceededException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 400 for OrgCycleDetectedException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgCycleDetectedException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return 404 for InvitationNotFoundException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new InvitationNotFoundException('inv-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return 404 for AdminUserNotFoundException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new AdminUserNotFoundException('u-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return 404 for AdminOrgNotFoundException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new AdminOrgNotFoundException('org-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return 409 for EmailConflictException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new EmailConflictException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT)
  })

  it('should return 409 for OrgSlugConflictException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgSlugConflictException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT)
  })

  it('should include structured error body with statusCode, message, errorCode, path, correlationId, and timestamp', () => {
    // Arrange
    const { host, getSentBody } = createMockHost({ url: '/admin/members/m-789' })
    const exception = new AdminMemberNotFoundException('m-789')

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.statusCode).toBe(404)
    expect(body.path).toBe('/admin/members/m-789')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('Member "m-789" not found')
    expect(body.errorCode).toBe('ADMIN_MEMBER_NOT_FOUND')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should include correct errorCode for each exception type', () => {
    // Arrange
    const cases = [
      {
        exception: new AdminMemberNotFoundException('m-1'),
        expectedCode: 'ADMIN_MEMBER_NOT_FOUND',
      },
      { exception: new AdminRoleNotFoundException('r-1'), expectedCode: 'ADMIN_ROLE_NOT_FOUND' },
      {
        exception: new MemberAlreadyExistsException(),
        expectedCode: 'MEMBER_ALREADY_EXISTS',
      },
      {
        exception: new InvitationAlreadyPendingException(),
        expectedCode: 'INVITATION_ALREADY_PENDING',
      },
      { exception: new LastOwnerConstraintException(), expectedCode: 'LAST_OWNER_CONSTRAINT' },
      { exception: new SelfRemovalException(), expectedCode: 'SELF_REMOVAL' },
      { exception: new SelfRoleChangeException(), expectedCode: 'SELF_ROLE_CHANGE' },
      { exception: new SelfActionException(), expectedCode: 'SELF_ACTION' },
      {
        exception: new AdminUserNotFoundException('u-1'),
        expectedCode: 'ADMIN_USER_NOT_FOUND',
      },
      {
        exception: new UserAlreadyBannedException('u-1'),
        expectedCode: 'USER_ALREADY_BANNED',
      },
      { exception: new EmailConflictException(), expectedCode: 'EMAIL_CONFLICT' },
      {
        exception: new InvitationNotFoundException('inv-1'),
        expectedCode: 'INVITATION_NOT_FOUND',
      },
      {
        exception: new AdminOrgNotFoundException('org-1'),
        expectedCode: 'ADMIN_ORG_NOT_FOUND',
      },
      { exception: new OrgSlugConflictException(), expectedCode: 'ADMIN_ORG_SLUG_CONFLICT' },
      { exception: new OrgDepthExceededException(), expectedCode: 'ADMIN_ORG_DEPTH_EXCEEDED' },
      { exception: new OrgCycleDetectedException(), expectedCode: 'ADMIN_ORG_CYCLE_DETECTED' },
    ]

    for (const { exception, expectedCode } of cases) {
      // Act
      const { host, getSentBody } = createMockHost()
      filter.catch(exception, host as never)

      // Assert
      expect(getSentBody().errorCode).toBe(expectedCode)
    }
  })

  it('should set x-correlation-id response header', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new AdminMemberNotFoundException('m-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })

  it('should include correlationId from ClsService in response body', () => {
    // Arrange
    const customCls = createMockCls('custom-corr-id')
    const customFilter = new AdminExceptionFilter(customCls as never)
    const { host, getSentBody } = createMockHost()
    const exception = new LastOwnerConstraintException()

    // Act
    customFilter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.correlationId).toBe('custom-corr-id')
    expect(customCls.getId).toHaveBeenCalled()
  })
})
