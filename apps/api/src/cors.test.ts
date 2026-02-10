import { describe, expect, it } from 'vitest'
import { parseCorsOrigins } from './cors.js'

describe('parseCorsOrigins', () => {
  describe('development mode', () => {
    it('should return a single origin as a string', () => {
      const result = parseCorsOrigins('http://localhost:3000', false)
      expect(result.origins).toBe('http://localhost:3000')
    })

    it('should return multiple origins as an array', () => {
      const result = parseCorsOrigins('http://localhost:3000,http://localhost:3001', false)
      expect(result.origins).toEqual(['http://localhost:3000', 'http://localhost:3001'])
    })

    it('should allow wildcard in development', () => {
      const result = parseCorsOrigins('*', false)
      expect(result.origins).toBe('*')
    })

    it('should trim whitespace from origins', () => {
      const result = parseCorsOrigins(' http://a.com , http://b.com ', false)
      expect(result.origins).toEqual(['http://a.com', 'http://b.com'])
    })

    it('should filter empty entries from trailing commas', () => {
      const result = parseCorsOrigins('http://a.com,,', false)
      expect(result.origins).toBe('http://a.com')
    })
  })

  describe('production mode', () => {
    it('should reject wildcard and return false when only wildcard', () => {
      const result = parseCorsOrigins('*', true)
      expect(result.origins).toBe(false)
      expect(result.warning).toContain('wildcard')
    })

    it('should remove wildcard but keep other origins', () => {
      const result = parseCorsOrigins('*,https://app.example.com', true)
      expect(result.origins).toBe('https://app.example.com')
      expect(result.warning).toBeUndefined()
    })

    it('should remove wildcard from mixed list and return remaining as array', () => {
      const result = parseCorsOrigins('*,https://a.com,https://b.com', true)
      expect(result.origins).toEqual(['https://a.com', 'https://b.com'])
    })

    it('should allow explicit origins without wildcard', () => {
      const result = parseCorsOrigins('https://app.example.com', true)
      expect(result.origins).toBe('https://app.example.com')
      expect(result.warning).toBeUndefined()
    })
  })
})
