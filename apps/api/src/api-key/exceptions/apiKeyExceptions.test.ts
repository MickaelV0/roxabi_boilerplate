import { describe, expect, it } from 'vitest'
import { ErrorCode } from '../../common/errorCodes.js'
import { ApiKeyExpiryInPastException } from './apiKeyExpiryInPast.exception.js'
import { ApiKeyNotFoundException } from './apiKeyNotFound.exception.js'
import { ApiKeyScopesExceededException } from './apiKeyScopesExceeded.exception.js'

describe('ApiKeyNotFoundException', () => {
  it('should set the name to ApiKeyNotFoundException', () => {
    // Arrange & Act
    const exception = new ApiKeyNotFoundException('key-1')

    // Assert
    expect(exception.name).toBe('ApiKeyNotFoundException')
  })

  it('should include the key id in the message', () => {
    // Arrange & Act
    const exception = new ApiKeyNotFoundException('key-abc')

    // Assert
    expect(exception.message).toBe('API key "key-abc" not found')
  })

  it('should set errorCode to API_KEY_NOT_FOUND', () => {
    // Arrange & Act
    const exception = new ApiKeyNotFoundException('key-1')

    // Assert
    expect(exception.errorCode).toBe(ErrorCode.API_KEY_NOT_FOUND)
  })

  it('should expose errorCode as a static property', () => {
    // Assert
    expect(ApiKeyNotFoundException.errorCode).toBe(ErrorCode.API_KEY_NOT_FOUND)
  })

  it('should be an instance of Error', () => {
    // Arrange & Act
    const exception = new ApiKeyNotFoundException('key-1')

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })
})

describe('ApiKeyScopesExceededException', () => {
  it('should set the name to ApiKeyScopesExceededException', () => {
    // Arrange & Act
    const exception = new ApiKeyScopesExceededException()

    // Assert
    expect(exception.name).toBe('ApiKeyScopesExceededException')
  })

  it('should have a descriptive message', () => {
    // Arrange & Act
    const exception = new ApiKeyScopesExceededException()

    // Assert
    expect(exception.message).toBe('Requested scopes exceed your current permissions')
  })

  it('should set errorCode to API_KEY_SCOPES_EXCEEDED', () => {
    // Arrange & Act
    const exception = new ApiKeyScopesExceededException()

    // Assert
    expect(exception.errorCode).toBe(ErrorCode.API_KEY_SCOPES_EXCEEDED)
  })

  it('should expose errorCode as a static property', () => {
    // Assert
    expect(ApiKeyScopesExceededException.errorCode).toBe(ErrorCode.API_KEY_SCOPES_EXCEEDED)
  })

  it('should be an instance of Error', () => {
    // Arrange & Act
    const exception = new ApiKeyScopesExceededException()

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })
})

describe('ApiKeyExpiryInPastException', () => {
  it('should set the name to ApiKeyExpiryInPastException', () => {
    // Arrange & Act
    const exception = new ApiKeyExpiryInPastException()

    // Assert
    expect(exception.name).toBe('ApiKeyExpiryInPastException')
  })

  it('should have a descriptive message', () => {
    // Arrange & Act
    const exception = new ApiKeyExpiryInPastException()

    // Assert
    expect(exception.message).toBe('Expiry date must be in the future')
  })

  it('should set errorCode to API_KEY_EXPIRY_IN_PAST', () => {
    // Arrange & Act
    const exception = new ApiKeyExpiryInPastException()

    // Assert
    expect(exception.errorCode).toBe(ErrorCode.API_KEY_EXPIRY_IN_PAST)
  })

  it('should expose errorCode as a static property', () => {
    // Assert
    expect(ApiKeyExpiryInPastException.errorCode).toBe(ErrorCode.API_KEY_EXPIRY_IN_PAST)
  })

  it('should be an instance of Error', () => {
    // Arrange & Act
    const exception = new ApiKeyExpiryInPastException()

    // Assert
    expect(exception).toBeInstanceOf(Error)
  })
})
