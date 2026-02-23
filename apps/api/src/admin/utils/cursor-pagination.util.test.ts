import { describe, expect, it } from 'vitest'

import {
  buildCursorCondition,
  buildCursorResponse,
  decodeCursor,
  encodeCursor,
} from './cursor-pagination.util.js'

describe('cursor-pagination.util', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('should encode a timestamp and id into a Base64 string', () => {
      // Arrange
      const timestamp = new Date('2024-01-15T10:30:00.000Z')
      const id = 'abc-123'

      // Act
      const cursor = encodeCursor(timestamp, id)

      // Assert
      expect(typeof cursor).toBe('string')
      expect(cursor.length).toBeGreaterThan(0)
      // Base64 characters only (URL-safe or standard)
      expect(cursor).toMatch(/^[A-Za-z0-9+/=_-]+$/)
    })

    it('should decode a Base64 cursor back to timestamp and id', () => {
      // Arrange
      const timestamp = new Date('2024-01-15T10:30:00.000Z')
      const id = 'abc-123'
      const cursor = encodeCursor(timestamp, id)

      // Act
      const decoded = decodeCursor(cursor)

      // Assert
      expect(decoded.timestamp).toEqual(timestamp)
      expect(decoded.id).toBe(id)
    })

    it('should roundtrip encode/decode correctly', () => {
      // Arrange
      const originalTimestamp = new Date('2023-06-20T14:22:05.123Z')
      const originalId = 'user-7f3a9b12-c4e8-4d91-a5b6-c2d8e1f0a3b7'

      // Act
      const cursor = encodeCursor(originalTimestamp, originalId)
      const decoded = decodeCursor(cursor)

      // Assert
      expect(decoded.timestamp).toEqual(originalTimestamp)
      expect(decoded.id).toBe(originalId)
    })

    it('should throw on invalid cursor string', () => {
      // Arrange
      const invalidCursor = 'not-a-valid-cursor!!!'

      // Act & Assert
      expect(() => decodeCursor(invalidCursor)).toThrow()
    })

    it('should throw on empty cursor string', () => {
      // Act & Assert
      expect(() => decodeCursor('')).toThrow()
    })

    it('should handle timestamp at Unix epoch (edge case)', () => {
      // Arrange
      const epoch = new Date(0)
      const id = 'epoch-id'

      // Act
      const cursor = encodeCursor(epoch, id)
      const decoded = decodeCursor(cursor)

      // Assert
      expect(decoded.timestamp).toEqual(epoch)
      expect(decoded.id).toBe(id)
    })

    it('should handle a very long id (edge case)', () => {
      // Arrange
      const timestamp = new Date('2024-03-01T00:00:00.000Z')
      const longId = 'x'.repeat(256)

      // Act
      const cursor = encodeCursor(timestamp, longId)
      const decoded = decodeCursor(cursor)

      // Assert
      expect(decoded.id).toBe(longId)
      expect(decoded.timestamp).toEqual(timestamp)
    })

    it('should produce different cursors for different timestamps with same id', () => {
      // Arrange
      const id = 'same-id'
      const ts1 = new Date('2024-01-01T00:00:00.000Z')
      const ts2 = new Date('2024-02-01T00:00:00.000Z')

      // Act
      const cursor1 = encodeCursor(ts1, id)
      const cursor2 = encodeCursor(ts2, id)

      // Assert
      expect(cursor1).not.toBe(cursor2)
    })

    it('should produce different cursors for different ids with same timestamp', () => {
      // Arrange
      const ts = new Date('2024-01-01T00:00:00.000Z')
      const id1 = 'id-alpha'
      const id2 = 'id-beta'

      // Act
      const cursor1 = encodeCursor(ts, id1)
      const cursor2 = encodeCursor(ts, id2)

      // Assert
      expect(cursor1).not.toBe(cursor2)
    })
  })

  describe('buildCursorCondition', () => {
    it('should return a truthy SQL condition object', () => {
      // Arrange
      const timestamp = new Date('2024-01-15T10:30:00.000Z')
      const id = 'row-abc'
      const cursor = encodeCursor(timestamp, id)
      const mockTsColumn = {} as never
      const mockIdColumn = {} as never

      // Act
      const result = buildCursorCondition(cursor, mockTsColumn, mockIdColumn)

      // Assert — just verify it exists and is not null/undefined
      expect(result).toBeDefined()
      expect(result).not.toBeNull()
    })
  })

  describe('buildCursorResponse', () => {
    type Row = { createdAt: Date; id: string; name: string }

    function makeRow(id: string, createdAt: Date, name = `name-${id}`): Row {
      return { id, createdAt, name }
    }

    const getTimestamp = (row: Row) => row.createdAt
    const getId = (row: Row) => row.id

    it('should trim N+1 rows to N and set hasMore=true', () => {
      // Arrange
      const limit = 3
      const rows: Row[] = [
        makeRow('id-1', new Date('2024-01-01T00:00:01.000Z')),
        makeRow('id-2', new Date('2024-01-01T00:00:02.000Z')),
        makeRow('id-3', new Date('2024-01-01T00:00:03.000Z')),
        makeRow('id-4', new Date('2024-01-01T00:00:04.000Z')), // N+1 extra row
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.data).toHaveLength(3)
      expect(response.cursor.hasMore).toBe(true)
    })

    it('should not include the extra row in data when N+1 rows are given', () => {
      // Arrange
      const limit = 2
      const rows: Row[] = [
        makeRow('id-1', new Date('2024-01-01T00:00:01.000Z')),
        makeRow('id-2', new Date('2024-01-01T00:00:02.000Z')),
        makeRow('id-3', new Date('2024-01-01T00:00:03.000Z')), // N+1 extra row
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.data.map((r) => r.id)).toEqual(['id-1', 'id-2'])
    })

    it('should compute the next cursor from the last retained row when hasMore=true', () => {
      // Arrange
      const limit = 2
      const lastRetained = makeRow('id-2', new Date('2024-01-01T00:00:02.000Z'))
      const rows: Row[] = [
        makeRow('id-1', new Date('2024-01-01T00:00:01.000Z')),
        lastRetained,
        makeRow('id-3', new Date('2024-01-01T00:00:03.000Z')), // N+1 extra row
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.cursor.next).not.toBeNull()
      // The next cursor must decode back to the last retained row's values
      const decoded = decodeCursor(response.cursor.next as string)
      expect(decoded.id).toBe(lastRetained.id)
      expect(decoded.timestamp).toEqual(lastRetained.createdAt)
    })

    it('should set hasMore=false when exactly N rows are returned', () => {
      // Arrange
      const limit = 3
      const rows: Row[] = [
        makeRow('id-1', new Date('2024-01-01T00:00:01.000Z')),
        makeRow('id-2', new Date('2024-01-01T00:00:02.000Z')),
        makeRow('id-3', new Date('2024-01-01T00:00:03.000Z')),
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.data).toHaveLength(3)
      expect(response.cursor.hasMore).toBe(false)
    })

    it('should return null next cursor when hasMore=false', () => {
      // Arrange
      const limit = 5
      const rows: Row[] = [
        makeRow('id-1', new Date('2024-01-01T00:00:01.000Z')),
        makeRow('id-2', new Date('2024-01-01T00:00:02.000Z')),
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.cursor.next).toBeNull()
      expect(response.cursor.hasMore).toBe(false)
    })

    it('should return empty data, hasMore=false, and next=null when 0 rows are given', () => {
      // Arrange
      const limit = 10
      const rows: Row[] = []

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.data).toHaveLength(0)
      expect(response.cursor.hasMore).toBe(false)
      expect(response.cursor.next).toBeNull()
    })

    it('should return 1 row with hasMore=false when limit=1 and exactly 1 row given', () => {
      // Arrange
      const limit = 1
      const rows: Row[] = [makeRow('id-1', new Date('2024-01-01T00:00:01.000Z'))]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.data).toHaveLength(1)
      expect(response.cursor.hasMore).toBe(false)
      expect(response.cursor.next).toBeNull()
    })

    it('should return 1 row with hasMore=true when limit=1 and N+1 rows given', () => {
      // Arrange
      const limit = 1
      const rows: Row[] = [
        makeRow('id-1', new Date('2024-01-01T00:00:01.000Z')),
        makeRow('id-2', new Date('2024-01-01T00:00:02.000Z')), // N+1 extra row
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      expect(response.data).toHaveLength(1)
      expect(response.cursor.hasMore).toBe(true)
      expect(response.cursor.next).not.toBeNull()
    })

    it('should preserve the original row data without mutation', () => {
      // Arrange
      const limit = 2
      const originalRow = makeRow('id-1', new Date('2024-01-01T00:00:01.000Z'), 'Alice')
      const rows: Row[] = [
        originalRow,
        makeRow('id-2', new Date('2024-01-01T00:00:02.000Z'), 'Bob'),
        makeRow('id-3', new Date('2024-01-01T00:00:03.000Z'), 'Carol'), // N+1
      ]

      // Act
      const response = buildCursorResponse(rows, limit, getTimestamp, getId)

      // Assert
      const firstRow = response.data[0]
      expect(firstRow).toEqual(originalRow)
      expect(firstRow?.name).toBe('Alice')
    })
  })
})
