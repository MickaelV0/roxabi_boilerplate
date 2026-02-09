import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-form', () => ({
  createFormHook: vi.fn(() => ({
    useAppForm: vi.fn(),
  })),
}))

vi.mock('../components/demo.FormComponents', () => ({
  TextField: vi.fn(),
  Select: vi.fn(),
  TextArea: vi.fn(),
  SubscribeButton: vi.fn(),
}))

vi.mock('./demo.form-context', () => ({
  fieldContext: {},
  formContext: {},
}))

describe('demo.form', () => {
  it('should export useAppForm', async () => {
    const { useAppForm } = await import('./demo.form')

    expect(useAppForm).toBeDefined()
  })

  it('should export useAppForm as a function', async () => {
    const { useAppForm } = await import('./demo.form')

    expect(typeof useAppForm).toBe('function')
  })
})
