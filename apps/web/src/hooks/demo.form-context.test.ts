import { describe, expect, it } from 'vitest'

import { fieldContext, formContext, useFieldContext, useFormContext } from './demo.form-context'

describe('demo.form-context', () => {
  it('should export fieldContext', () => {
    expect(fieldContext).toBeDefined()
  })

  it('should export useFieldContext as a function', () => {
    expect(useFieldContext).toBeDefined()
    expect(typeof useFieldContext).toBe('function')
  })

  it('should export formContext', () => {
    expect(formContext).toBeDefined()
  })

  it('should export useFormContext as a function', () => {
    expect(useFormContext).toBeDefined()
    expect(typeof useFormContext).toBe('function')
  })
})
