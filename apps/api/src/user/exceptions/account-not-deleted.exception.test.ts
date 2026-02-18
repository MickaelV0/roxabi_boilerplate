import { describe, expect, it } from 'vitest'

import { AccountNotDeletedException } from './account-not-deleted.exception.js'

describe('AccountNotDeletedException', () => {
  it('should set message describing the precondition', () => {
    // Arrange & Act
    const exception = new AccountNotDeletedException()

    // Assert
    expect(exception.message).toBe(
      'Account must be scheduled for deletion before it can be permanently deleted'
    )
  })

  it('should set name to AccountNotDeletedException', () => {
    // Arrange & Act
    const exception = new AccountNotDeletedException()

    // Assert
    expect(exception.name).toBe('AccountNotDeletedException')
  })

  it('should extend Error', () => {
    // Arrange & Act
    const exception = new AccountNotDeletedException()

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })

  it('should have errorCode property set to ACCOUNT_NOT_DELETED', () => {
    // Arrange & Act
    const exception = new AccountNotDeletedException()

    // Assert
    expect(exception.errorCode).toBe('ACCOUNT_NOT_DELETED')
  })

  it('should have static errorCode matching instance errorCode', () => {
    // Assert
    expect(AccountNotDeletedException.errorCode).toBe('ACCOUNT_NOT_DELETED')
    const exception = new AccountNotDeletedException()
    expect(exception.errorCode).toBe(AccountNotDeletedException.errorCode)
  })
})
