import { describe, expect, it } from 'vitest'

import { fullName, store } from './demo-store'

describe('demo-store', () => {
  it('should have correct initial state', () => {
    expect(store.state.firstName).toBe('Jane')
    expect(store.state.lastName).toBe('Smith')
  })

  it('should derive fullName from firstName and lastName', () => {
    expect(fullName.state).toBe('Jane Smith')
  })

  it('should update fullName when firstName changes', () => {
    store.setState((prev) => ({ ...prev, firstName: 'John' }))

    expect(fullName.state).toBe('John Smith')

    // Restore original state
    store.setState((prev) => ({ ...prev, firstName: 'Jane' }))
  })

  it('should update fullName when lastName changes', () => {
    store.setState((prev) => ({ ...prev, lastName: 'Doe' }))

    expect(fullName.state).toBe('Jane Doe')

    // Restore original state
    store.setState((prev) => ({ ...prev, lastName: 'Smith' }))
  })
})
