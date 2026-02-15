import { describe, expect, it } from 'vitest'
import { clientEnvSchema } from './env.client'

describe('clientEnvSchema', () => {
  describe('default values', () => {
    it('should default VITE_ENABLE_DEMO to "true" when parsing empty object', () => {
      // Arrange
      const input = {}

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_ENABLE_DEMO).toBe('true')
    })

    it('should leave VITE_GITHUB_REPO_URL undefined when not provided', () => {
      // Arrange
      const input = {}

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_GITHUB_REPO_URL).toBeUndefined()
    })
  })

  describe('VITE_ENABLE_DEMO', () => {
    it('should accept any string value', () => {
      // Arrange
      const input = { VITE_ENABLE_DEMO: 'false' }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_ENABLE_DEMO).toBe('false')
    })

    it('should accept an empty string', () => {
      // Arrange
      const input = { VITE_ENABLE_DEMO: '' }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_ENABLE_DEMO).toBe('')
    })

    it('should default to "true" when explicitly undefined', () => {
      // Arrange
      const input = { VITE_ENABLE_DEMO: undefined }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_ENABLE_DEMO).toBe('true')
    })
  })

  describe('VITE_GITHUB_REPO_URL', () => {
    it('should accept a valid HTTPS URL', () => {
      // Arrange
      const input = { VITE_GITHUB_REPO_URL: 'https://github.com/example/repo' }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_GITHUB_REPO_URL).toBe('https://github.com/example/repo')
    })

    it('should accept a valid HTTP URL', () => {
      // Arrange
      const input = { VITE_GITHUB_REPO_URL: 'http://localhost:3000' }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_GITHUB_REPO_URL).toBe('http://localhost:3000')
    })

    it('should reject an invalid URL string', () => {
      // Arrange
      const input = { VITE_GITHUB_REPO_URL: 'not-a-url' }

      // Act & Assert
      expect(() => clientEnvSchema.parse(input)).toThrow()
    })

    it('should reject a bare domain without protocol', () => {
      // Arrange
      const input = { VITE_GITHUB_REPO_URL: 'github.com/example/repo' }

      // Act & Assert
      expect(() => clientEnvSchema.parse(input)).toThrow()
    })

    it('should accept undefined (optional field)', () => {
      // Arrange
      const input = { VITE_GITHUB_REPO_URL: undefined }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result.VITE_GITHUB_REPO_URL).toBeUndefined()
    })
  })

  describe('full valid parse', () => {
    it('should parse a complete valid input with both fields', () => {
      // Arrange
      const input = {
        VITE_ENABLE_DEMO: 'false',
        VITE_GITHUB_REPO_URL: 'https://github.com/roxabi/boilerplate',
      }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result).toEqual({
        VITE_ENABLE_DEMO: 'false',
        VITE_GITHUB_REPO_URL: 'https://github.com/roxabi/boilerplate',
      })
    })

    it('should strip unknown keys from input', () => {
      // Arrange
      const input = {
        VITE_ENABLE_DEMO: 'true',
        UNKNOWN_KEY: 'should be stripped',
      }

      // Act
      const result = clientEnvSchema.parse(input)

      // Assert
      expect(result).not.toHaveProperty('UNKNOWN_KEY')
      expect(result.VITE_ENABLE_DEMO).toBe('true')
    })
  })
})
