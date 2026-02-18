import { describe, expect, it } from 'vitest'
import { buildDiceBearUrl } from './buildDiceBearUrl'

describe('buildDiceBearUrl', () => {
  it('should build a basic URL with style and seed', () => {
    // Act
    const url = buildDiceBearUrl('lorelei', 'my-seed')

    // Assert
    expect(url).toBe('https://api.dicebear.com/9.x/lorelei/svg?seed=my-seed')
  })

  it('should include options as query parameters', () => {
    // Arrange
    const options = { backgroundColor: 'ff0000', radius: 50 }

    // Act
    const url = buildDiceBearUrl('bottts', 'test-seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('seed')).toBe('test-seed')
    expect(parsed.searchParams.get('backgroundColor')).toBe('ff0000')
    expect(parsed.searchParams.get('radius')).toBe('50')
  })

  it('should use the correct CDN base URL', () => {
    // Act
    const url = buildDiceBearUrl('pixel-art', 'seed')

    // Assert
    expect(url).toMatch(/^https:\/\/api\.dicebear\.com\/9\.x\//)
  })

  it('should include the style in the URL path', () => {
    // Act
    const url = buildDiceBearUrl('adventurer', 'seed')

    // Assert
    expect(url).toContain('/adventurer/svg')
  })

  it('should skip options with undefined values', () => {
    // Arrange
    const options = { color: undefined, mouth: 'smile' }

    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.has('color')).toBe(false)
    expect(parsed.searchParams.get('mouth')).toBe('smile')
  })

  it('should skip options with null values', () => {
    // Arrange
    const options = { eyes: null, nose: 'round' }

    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.has('eyes')).toBe(false)
    expect(parsed.searchParams.get('nose')).toBe('round')
  })

  it('should convert numeric values to strings', () => {
    // Arrange
    const options = { radius: 10, scale: 80 }

    // Act
    const url = buildDiceBearUrl('thumbs', 'seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('radius')).toBe('10')
    expect(parsed.searchParams.get('scale')).toBe('80')
  })

  it('should convert boolean values to strings', () => {
    // Arrange
    const options = { flip: true, rotate: false }

    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('flip')).toBe('true')
    expect(parsed.searchParams.get('rotate')).toBe('false')
  })

  it('should join array values with commas', () => {
    // Arrange
    const options = { backgroundColor: ['ff0000', '00ff00', '0000ff'] }

    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('backgroundColor')).toBe('ff0000,00ff00,0000ff')
  })

  it('should handle an empty options object', () => {
    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', {})

    // Assert
    expect(url).toBe('https://api.dicebear.com/9.x/lorelei/svg?seed=seed')
  })

  it('should default options to an empty object when not provided', () => {
    // Act
    const url = buildDiceBearUrl('lorelei', 'seed')

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('seed')).toBe('seed')
    // Only the seed param should be present
    expect([...parsed.searchParams.keys()]).toEqual(['seed'])
  })

  it('should handle special characters in the seed', () => {
    // Act
    const url = buildDiceBearUrl('lorelei', 'user@example.com')

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('seed')).toBe('user@example.com')
  })

  it('should handle an empty seed string', () => {
    // Act
    const url = buildDiceBearUrl('lorelei', '')

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('seed')).toBe('')
  })

  it('should include zero as a valid option value', () => {
    // Arrange
    const options = { radius: 0 }

    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', options)

    // Assert
    const parsed = new URL(url)
    expect(parsed.searchParams.get('radius')).toBe('0')
  })

  it('should handle an empty string option value', () => {
    // Arrange -- empty strings are falsy but the implementation allows them
    // (the filter checks for !== undefined && !== null only)
    const options = { mouth: '' }

    // Act
    const url = buildDiceBearUrl('lorelei', 'seed', options)

    // Assert
    const parsed = new URL(url)
    // Empty string is not filtered since the code only filters undefined/null
    expect(parsed.searchParams.get('mouth')).toBe('')
  })
})
