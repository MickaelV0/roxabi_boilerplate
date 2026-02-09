import { describe, expect, it } from 'vitest'

import { makeData } from './demo-table-data'

describe('demo-table-data', () => {
  describe('makeData', () => {
    it('should return correct number of entries for a single level', () => {
      const data = makeData(5)

      expect(data).toHaveLength(5)
    })

    it('should return entries with correct shape', () => {
      const data = makeData(1)
      expect(data).toHaveLength(1)

      const person = data[0]
      expect(person).toBeDefined()
      expect(person?.id).toBe(0)
      expect(typeof person?.firstName).toBe('string')
      expect(typeof person?.lastName).toBe('string')
      expect(typeof person?.age).toBe('number')
      expect(typeof person?.visits).toBe('number')
      expect(typeof person?.progress).toBe('number')
      expect(['relationship', 'complicated', 'single']).toContain(person?.status)
    })

    it('should create nested subRows when multiple lengths are provided', () => {
      const data = makeData(2, 3)

      expect(data).toHaveLength(2)
      expect(data[0]?.subRows).toBeDefined()
      expect(data[0]?.subRows).toHaveLength(3)
    })

    it('should not create subRows for the deepest level', () => {
      const data = makeData(2, 3)

      expect(data[0]?.subRows?.[0]?.subRows).toBeUndefined()
    })

    it('should support multiple levels of nesting', () => {
      const data = makeData(1, 2, 3)

      expect(data).toHaveLength(1)
      expect(data[0]?.subRows).toHaveLength(2)
      expect(data[0]?.subRows?.[0]?.subRows).toHaveLength(3)
      expect(data[0]?.subRows?.[0]?.subRows?.[0]?.subRows).toBeUndefined()
    })

    it('should return empty array when length is 0', () => {
      const data = makeData(0)

      expect(data).toHaveLength(0)
    })
  })
})
