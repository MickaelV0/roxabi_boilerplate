import { describe, expect, it } from 'vitest'
import { featureFlagKeys } from './queryKeys.js'

describe('featureFlagKeys', () => {
  it('all key is the root', () => {
    expect(featureFlagKeys.all).toEqual(['feature-flags'])
  })

  it('list() starts from all', () => {
    expect(featureFlagKeys.list()).toEqual([...featureFlagKeys.all, 'list'])
  })
})
