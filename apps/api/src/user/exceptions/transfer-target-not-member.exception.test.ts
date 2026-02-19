import { describe, expect, it } from 'vitest'

import { TransferTargetNotMemberException } from './transfer-target-not-member.exception.js'

describe('TransferTargetNotMemberException', () => {
  it('should set targetUserId property from constructor argument', () => {
    // Arrange
    const targetUserId = 'user-123'
    const orgId = 'org-456'

    // Act
    const exception = new TransferTargetNotMemberException(targetUserId, orgId)

    // Assert
    expect(exception.targetUserId).toBe('user-123')
  })

  it('should set orgId property from constructor argument', () => {
    // Arrange
    const targetUserId = 'user-123'
    const orgId = 'org-456'

    // Act
    const exception = new TransferTargetNotMemberException(targetUserId, orgId)

    // Assert
    expect(exception.orgId).toBe('org-456')
  })

  it('should set message including targetUserId and orgId', () => {
    // Arrange & Act
    const exception = new TransferTargetNotMemberException('user-abc', 'org-xyz')

    // Assert
    expect(exception.message).toBe('User user-abc is not a member of organization org-xyz')
  })

  it('should set name to TransferTargetNotMemberException', () => {
    // Arrange & Act
    const exception = new TransferTargetNotMemberException('any-user', 'any-org')

    // Assert
    expect(exception.name).toBe('TransferTargetNotMemberException')
  })

  it('should extend Error', () => {
    // Arrange & Act
    const exception = new TransferTargetNotMemberException('any-user', 'any-org')

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })

  it('should have errorCode property set to TRANSFER_TARGET_NOT_MEMBER', () => {
    // Arrange & Act
    const exception = new TransferTargetNotMemberException('any-user', 'any-org')

    // Assert
    expect(exception.errorCode).toBe('TRANSFER_TARGET_NOT_MEMBER')
  })

  it('should have static errorCode matching instance errorCode', () => {
    // Assert
    expect(TransferTargetNotMemberException.errorCode).toBe('TRANSFER_TARGET_NOT_MEMBER')
    const exception = new TransferTargetNotMemberException('any-user', 'any-org')
    expect(exception.errorCode).toBe(TransferTargetNotMemberException.errorCode)
  })
})
