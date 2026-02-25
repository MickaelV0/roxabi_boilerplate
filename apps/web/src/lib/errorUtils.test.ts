import { describe, expect, it } from 'vitest'
import { isErrorWithMessage, parseErrorMessage } from './errorUtils'

describe('isErrorWithMessage', () => {
  it('should return true for object with string message', () => {
    expect(isErrorWithMessage({ message: 'hello' })).toBe(true)
  })

  it('should return false for null', () => {
    expect(isErrorWithMessage(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isErrorWithMessage(undefined)).toBe(false)
  })

  it('should return false for non-object', () => {
    expect(isErrorWithMessage('string')).toBe(false)
  })

  it('should return false for object without message', () => {
    expect(isErrorWithMessage({ name: 'err' })).toBe(false)
  })

  it('should return false for object with non-string message', () => {
    expect(isErrorWithMessage({ message: 42 })).toBe(false)
  })
})

describe('parseErrorMessage', () => {
  it('should return message from valid error object', () => {
    expect(parseErrorMessage({ message: 'oops' }, 'fallback')).toBe('oops')
  })

  it('should return fallback for invalid data', () => {
    expect(parseErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
