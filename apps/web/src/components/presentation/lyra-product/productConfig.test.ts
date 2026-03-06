import { describe, expect, it } from 'vitest'
import { PRODUCT_SECTION_IDS } from './productConfig'

describe('productConfig', () => {
  it('starts with title section', () => {
    expect(PRODUCT_SECTION_IDS[0]).toBe('title')
  })

  it('ends with closing section', () => {
    expect(PRODUCT_SECTION_IDS.at(-1)).toBe('closing')
  })

  it('contains exactly 18 sections', () => {
    expect(PRODUCT_SECTION_IDS).toHaveLength(18)
  })
})
