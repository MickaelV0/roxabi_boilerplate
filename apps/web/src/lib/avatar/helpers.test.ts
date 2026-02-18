import { describe, expect, it } from 'vitest'
import {
  formatOptionLabel,
  isAvatarStyle,
  isColorProperty,
  isEnumProperty,
  isProbabilityProperty,
} from './helpers'
import type { SchemaProperty } from './types'

describe('isColorProperty', () => {
  it('should return true for a valid color property', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'string', pattern: '^#[a-fA-F0-9]{6}$' },
    }

    // Act
    const result = isColorProperty(prop)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when type is not array', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'string',
      items: { type: 'string', pattern: '^#[a-fA-F0-9]{6}$' },
    }

    // Act
    const result = isColorProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when items is undefined', () => {
    // Arrange
    const prop: SchemaProperty = { type: 'array' }

    // Act
    const result = isColorProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when items.type is not string', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'number', pattern: '^#[a-fA-F0-9]{6}$' },
    }

    // Act
    const result = isColorProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when pattern is missing', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'string' },
    }

    // Act
    const result = isColorProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when pattern does not contain hex color characters', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'string', pattern: '^[0-9]+$' },
    }

    // Act
    const result = isColorProperty(prop)

    // Assert
    expect(result).toBe(false)
  })
})

describe('isEnumProperty', () => {
  it('should return true for a valid enum property', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'string', enum: ['option1', 'option2'] },
    }

    // Act
    const result = isEnumProperty(prop)

    // Assert
    expect(result).toBe(true)
  })

  it('should return true for an enum property with an empty enum array', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'string', enum: [] },
    }

    // Act
    const result = isEnumProperty(prop)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when type is not array', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'string',
      items: { type: 'string', enum: ['a'] },
    }

    // Act
    const result = isEnumProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when items is undefined', () => {
    // Arrange
    const prop: SchemaProperty = { type: 'array' }

    // Act
    const result = isEnumProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when items.type is not string', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'number', enum: ['a'] },
    }

    // Act
    const result = isEnumProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when enum is missing', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'array',
      items: { type: 'string' },
    }

    // Act
    const result = isEnumProperty(prop)

    // Assert
    expect(result).toBe(false)
  })
})

describe('isProbabilityProperty', () => {
  it('should return true for a valid probability property', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    }

    // Act
    const result = isProbabilityProperty(prop)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when type is not integer', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'number',
      minimum: 0,
      maximum: 100,
    }

    // Act
    const result = isProbabilityProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when minimum is not 0', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'integer',
      minimum: 1,
      maximum: 100,
    }

    // Act
    const result = isProbabilityProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when maximum is not 100', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'integer',
      minimum: 0,
      maximum: 50,
    }

    // Act
    const result = isProbabilityProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when minimum is undefined', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'integer',
      maximum: 100,
    }

    // Act
    const result = isProbabilityProperty(prop)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when maximum is undefined', () => {
    // Arrange
    const prop: SchemaProperty = {
      type: 'integer',
      minimum: 0,
    }

    // Act
    const result = isProbabilityProperty(prop)

    // Assert
    expect(result).toBe(false)
  })
})

describe('formatOptionLabel', () => {
  it('should convert camelCase to Title Case with spaces', () => {
    // Act
    const result = formatOptionLabel('backgroundColor')

    // Assert
    expect(result).toBe('Background Color')
  })

  it('should capitalize the first letter of a lowercase word', () => {
    // Act
    const result = formatOptionLabel('seed')

    // Assert
    expect(result).toBe('Seed')
  })

  it('should handle a single uppercase letter in the middle', () => {
    // Act
    const result = formatOptionLabel('hatColor')

    // Assert
    expect(result).toBe('Hat Color')
  })

  it('should handle multiple consecutive uppercase transitions', () => {
    // Act
    const result = formatOptionLabel('accessoriesColor')

    // Assert
    expect(result).toBe('Accessories Color')
  })

  it('should handle an already capitalized first letter', () => {
    // Act
    const result = formatOptionLabel('Mouth')

    // Assert
    expect(result).toBe('Mouth')
  })

  it('should handle an empty string', () => {
    // Act
    const result = formatOptionLabel('')

    // Assert
    expect(result).toBe('')
  })

  it('should trim leading spaces introduced by a leading uppercase letter', () => {
    // Act
    const result = formatOptionLabel('SkinColor')

    // Assert
    expect(result).toBe('Skin Color')
  })
})

describe('isAvatarStyle', () => {
  it('should return true for a valid avatar style', () => {
    // Act
    const result = isAvatarStyle('lorelei')

    // Assert
    expect(result).toBe(true)
  })

  it('should return true for each known avatar style', () => {
    // Arrange
    const knownStyles = [
      'lorelei',
      'bottts',
      'pixel-art',
      'thumbs',
      'avataaars',
      'adventurer',
      'toon-head',
    ]

    for (const style of knownStyles) {
      // Act
      const result = isAvatarStyle(style)

      // Assert
      expect(result).toBe(true)
    }
  })

  it('should return false for an unknown style', () => {
    // Act
    const result = isAvatarStyle('nonexistent-style')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for an empty string', () => {
    // Act
    const result = isAvatarStyle('')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for a style with wrong casing', () => {
    // Act
    const result = isAvatarStyle('Lorelei')

    // Assert
    expect(result).toBe(false)
  })
})
