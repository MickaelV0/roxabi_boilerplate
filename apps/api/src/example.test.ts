import { describe, expect, it } from 'vitest'

function add(a: number, b: number): number {
  return a + b
}

describe('Example API tests', () => {
  it('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('handles negative numbers', () => {
    expect(add(-1, 1)).toBe(0)
  })

  it('handles zero', () => {
    expect(add(0, 0)).toBe(0)
  })
})
