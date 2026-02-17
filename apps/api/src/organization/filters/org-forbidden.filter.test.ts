import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { OrgNameConfirmationMismatchException } from '../exceptions/org-name-confirmation-mismatch.exception.js'
import { OrgNotDeletedException } from '../exceptions/org-not-deleted.exception.js'
import { OrgNotOwnerException } from '../exceptions/org-not-owner.exception.js'
import {
  OrgNameConfirmationMismatchFilter,
  OrgNotDeletedFilter,
  OrgNotOwnerFilter,
} from './org-forbidden.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost() {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = { url: '/api/organizations/org-123' }
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

describe('OrgNotOwnerFilter', () => {
  const cls = createMockCls()
  const filter = new OrgNotOwnerFilter(cls as never)

  it('should return 403 for OrgNotOwnerException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgNotOwnerException('org-123')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
  })

  it('should return structured error response body', () => {
    // Arrange
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNotOwnerException('org-456')

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.statusCode).toBe(403)
    expect(body.path).toBe('/api/organizations/org-123')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('User is not an owner of organization org-456')
    expect(body.errorCode).toBe('ORG_NOT_OWNER')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should set x-correlation-id header', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new OrgNotOwnerException('org-123')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })
})

describe('OrgNameConfirmationMismatchFilter', () => {
  const cls = createMockCls()
  const filter = new OrgNameConfirmationMismatchFilter(cls as never)

  it('should return 400 for OrgNameConfirmationMismatchException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgNameConfirmationMismatchException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return structured error response body', () => {
    // Arrange
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNameConfirmationMismatchException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.statusCode).toBe(400)
    expect(body.path).toBe('/api/organizations/org-123')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('Organization name confirmation does not match')
    expect(body.errorCode).toBe('ORG_NAME_CONFIRMATION_MISMATCH')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should set x-correlation-id header', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new OrgNameConfirmationMismatchException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })
})

describe('OrgNotDeletedFilter', () => {
  const cls = createMockCls()
  const filter = new OrgNotDeletedFilter(cls as never)

  it('should return 400 for OrgNotDeletedException', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgNotDeletedException('org-789')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return structured error response body', () => {
    // Arrange
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNotDeletedException('org-789')

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.statusCode).toBe(400)
    expect(body.path).toBe('/api/organizations/org-123')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('Organization org-789 is not scheduled for deletion')
    expect(body.errorCode).toBe('ORG_NOT_DELETED')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should set x-correlation-id header', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new OrgNotDeletedException('org-789')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })

  it('should use correlation ID from ClsService', () => {
    // Arrange
    const customCls = createMockCls('custom-id-xyz')
    const customFilter = new OrgNotDeletedFilter(customCls as never)
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNotDeletedException('org-000')

    // Act
    customFilter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.correlationId).toBe('custom-id-xyz')
    expect(customCls.getId).toHaveBeenCalled()
  })
})
