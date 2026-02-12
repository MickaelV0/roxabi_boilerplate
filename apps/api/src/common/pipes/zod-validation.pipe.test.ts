import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ZodValidationPipe } from './zod-validation.pipe.js'

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
})

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(testSchema)

  it('should return parsed data for valid input', () => {
    // Arrange
    const input = { name: 'Ada', age: 36 }

    // Act
    const result = pipe.transform(input)

    // Assert
    expect(result).toEqual({ name: 'Ada', age: 36 })
  })

  it('should strip unknown properties from input', () => {
    // Arrange
    const input = { name: 'Ada', age: 36, extra: 'should-be-stripped' }

    // Act
    const result = pipe.transform(input)

    // Assert
    expect(result).toEqual({ name: 'Ada', age: 36 })
    expect(result).not.toHaveProperty('extra')
  })

  it('should throw BadRequestException for invalid input', () => {
    // Arrange
    const input = { name: '', age: -1 }

    // Act & Assert
    expect(() => pipe.transform(input)).toThrow(BadRequestException)
  })

  it('should include field errors in the exception response', () => {
    expect.assertions(2)

    // Arrange
    const input = { name: '', age: 'not-a-number' }

    // Act & Assert
    try {
      pipe.transform(input)
      expect.unreachable('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const fieldErrors = (error as BadRequestException).getResponse() as Record<string, unknown>
      expect(fieldErrors).toEqual(
        expect.objectContaining({
          name: expect.any(Array),
          age: expect.any(Array),
        })
      )
    }
  })

  it('should throw when required fields are missing', () => {
    // Arrange
    const input = {}

    // Act & Assert
    expect(() => pipe.transform(input)).toThrow(BadRequestException)
  })

  it('should coerce types when the schema supports it', () => {
    // Arrange
    const coercingSchema = z.object({ count: z.coerce.number() })
    const coercingPipe = new ZodValidationPipe(coercingSchema)

    // Act
    const result = coercingPipe.transform({ count: '42' })

    // Assert
    expect(result).toEqual({ count: 42 })
  })
})
