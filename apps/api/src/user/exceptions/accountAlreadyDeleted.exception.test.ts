import { describe, expect, it } from 'vitest'

import { AccountAlreadyDeletedException } from './accountAlreadyDeleted.exception.js'

describe('AccountAlreadyDeletedException', () => {
  it('should set message describing the condition', () => {
    // Arrange & Act
    const exception = new AccountAlreadyDeletedException()

    // Assert
    expect(exception.message).toBe('Account is already scheduled for deletion')
  })

  it('should set name to AccountAlreadyDeletedException', () => {
    // Arrange & Act
    const exception = new AccountAlreadyDeletedException()

    // Assert
    expect(exception.name).toBe('AccountAlreadyDeletedException')
  })

  it('should extend Error', () => {
    // Arrange & Act
    const exception = new AccountAlreadyDeletedException()

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })

  it('should have errorCode property set to ACCOUNT_ALREADY_DELETED', () => {
    // Arrange & Act
    const exception = new AccountAlreadyDeletedException()

    // Assert
    expect(exception.errorCode).toBe('ACCOUNT_ALREADY_DELETED')
  })

  it('should have static errorCode matching instance errorCode', () => {
    // Assert
    expect(AccountAlreadyDeletedException.errorCode).toBe('ACCOUNT_ALREADY_DELETED')
    const exception = new AccountAlreadyDeletedException()
    expect(exception.errorCode).toBe(AccountAlreadyDeletedException.errorCode)
  })
})
