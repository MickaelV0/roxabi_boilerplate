import { describe, expect, it } from 'vitest'
import { getApiErrorData, isFetchError } from './apiErrorUtils'

function createFetchError(data: unknown, status = 400) {
  return {
    data,
    status,
    message: 'Fetch error',
  }
}

describe('isFetchError', () => {
  it('should return true for a valid fetch error object', () => {
    // Arrange
    const error = createFetchError({ statusCode: 400, message: 'Bad request' })

    // Act
    const result = isFetchError(error)

    // Assert
    expect(result).toBe(true)
  })

  it('should return true for a fetch error with null data', () => {
    // Arrange
    const error = { data: null, status: 500 }

    // Act
    const result = isFetchError(error)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false for null', () => {
    // Act
    const result = isFetchError(null)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for undefined', () => {
    // Act
    const result = isFetchError(undefined)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for a regular Error', () => {
    // Arrange
    const error = new Error('Something went wrong')

    // Act
    const result = isFetchError(error)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for a string', () => {
    // Act
    const result = isFetchError('error')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for a number', () => {
    // Act
    const result = isFetchError(42)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for an object missing data property', () => {
    // Arrange
    const error = { status: 400 }

    // Act
    const result = isFetchError(error)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for an object missing status property', () => {
    // Arrange
    const error = { data: { message: 'error' } }

    // Act
    const result = isFetchError(error)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for an empty object', () => {
    // Act
    const result = isFetchError({})

    // Assert
    expect(result).toBe(false)
  })
})

describe('getApiErrorData', () => {
  it('should extract error data from a valid fetch error', () => {
    // Arrange
    const errorData = {
      statusCode: 422,
      timestamp: '2025-01-01T00:00:00.000Z',
      path: '/api/test',
      correlationId: 'corr-123',
      message: 'Validation failed',
    }
    const error = createFetchError(errorData, 422)

    // Act
    const result = getApiErrorData(error)

    // Assert
    expect(result).toEqual(errorData)
  })

  it('should return null for null input', () => {
    // Act
    const result = getApiErrorData(null)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null for undefined input', () => {
    // Act
    const result = getApiErrorData(undefined)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null for a regular Error', () => {
    // Act
    const result = getApiErrorData(new Error('fail'))

    // Assert
    expect(result).toBeNull()
  })

  it('should return null when fetch error has no data', () => {
    // Arrange -- data is falsy (null)
    const error = { data: null, status: 500 }

    // Act
    const result = getApiErrorData(error)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null when fetch error has undefined data', () => {
    // Arrange -- data is falsy (undefined)
    const error = { data: undefined, status: 500 }

    // Act
    const result = getApiErrorData(error)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null for a plain object without data and status', () => {
    // Act
    const result = getApiErrorData({ message: 'not a fetch error' })

    // Assert
    expect(result).toBeNull()
  })
})
