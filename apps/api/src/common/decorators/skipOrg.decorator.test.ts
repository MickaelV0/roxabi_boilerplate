import { Reflector } from '@nestjs/core'
import { describe, expect, it } from 'vitest'
import { SKIP_ORG_KEY, SkipOrg } from './skipOrg.decorator.js'

describe('SkipOrg decorator', () => {
  it('should set SKIP_ORG metadata to true', () => {
    // Arrange
    @SkipOrg()
    class TestController {}

    // Act
    const reflector = new Reflector()
    const value = reflector.get(SKIP_ORG_KEY, TestController)

    // Assert
    expect(value).toBe(true)
  })

  it('should not set metadata on undecorated class', () => {
    // Arrange
    class UndecoratedController {}

    // Act
    const reflector = new Reflector()
    const value = reflector.get(SKIP_ORG_KEY, UndecoratedController)

    // Assert
    expect(value).toBeUndefined()
  })
})
