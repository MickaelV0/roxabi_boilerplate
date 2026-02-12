import { describe, expect, it } from 'vitest'

import { UserNotFoundException } from './user-not-found.exception.js'

describe('UserNotFoundException', () => {
  it('should set userId property from constructor argument', () => {
    // Arrange
    const userId = 'user-123'

    // Act
    const exception = new UserNotFoundException(userId)

    // Assert
    expect(exception.userId).toBe('user-123')
  })

  it('should set message including the userId', () => {
    // Arrange & Act
    const exception = new UserNotFoundException('abc-456')

    // Assert
    expect(exception.message).toBe('User abc-456 not found')
  })

  it('should set name to UserNotFoundException', () => {
    // Arrange & Act
    const exception = new UserNotFoundException('any-id')

    // Assert
    expect(exception.name).toBe('UserNotFoundException')
  })

  it('should extend Error', () => {
    // Arrange & Act
    const exception = new UserNotFoundException('any-id')

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })

  it('should have errorCode property set to USER_NOT_FOUND', () => {
    const exception = new UserNotFoundException('any-id')
    expect(exception.errorCode).toBe('USER_NOT_FOUND')
  })

  it('should have static errorCode matching instance errorCode', () => {
    expect(UserNotFoundException.errorCode).toBe('USER_NOT_FOUND')
    const exception = new UserNotFoundException('any-id')
    expect(exception.errorCode).toBe(UserNotFoundException.errorCode)
  })
})
