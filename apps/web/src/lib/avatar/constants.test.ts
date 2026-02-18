import { AVATAR_STYLES } from '@repo/types'
import { describe, expect, it } from 'vitest'
import { AVATAR_STYLE_LABELS, PRIMARY_KEYS, STYLE_IMPORTS } from './constants'

describe('PRIMARY_KEYS', () => {
  it('should be a Set of strings', () => {
    expect(PRIMARY_KEYS).toBeInstanceOf(Set)
    expect(PRIMARY_KEYS.size).toBeGreaterThan(0)
  })

  it('should contain common avatar option keys', () => {
    expect(PRIMARY_KEYS.has('eyes')).toBe(true)
    expect(PRIMARY_KEYS.has('mouth')).toBe(true)
    expect(PRIMARY_KEYS.has('backgroundColor')).toBe(true)
  })
})

describe('STYLE_IMPORTS', () => {
  it('should have an import function for every AVATAR_STYLE', () => {
    for (const style of AVATAR_STYLES) {
      expect(STYLE_IMPORTS[style]).toBeTypeOf('function')
    }
  })

  it.each(AVATAR_STYLES)('should dynamically import the %s style module', async (style) => {
    const mod = await STYLE_IMPORTS[style]()
    expect(mod).toBeDefined()
    expect(mod.schema).toBeDefined()
  })
})

describe('AVATAR_STYLE_LABELS', () => {
  it('should have a label for every AVATAR_STYLE', () => {
    for (const style of AVATAR_STYLES) {
      expect(AVATAR_STYLE_LABELS[style]).toBeTypeOf('string')
      expect(AVATAR_STYLE_LABELS[style].length).toBeGreaterThan(0)
    }
  })

  it('should have human-readable labels', () => {
    expect(AVATAR_STYLE_LABELS['pixel-art']).toBe('Pixel Art')
    expect(AVATAR_STYLE_LABELS['toon-head']).toBe('Toon Head')
    expect(AVATAR_STYLE_LABELS.lorelei).toBe('Lorelei')
  })
})
