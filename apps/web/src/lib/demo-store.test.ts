import { Derived, Store } from '@tanstack/store'
import { describe, expect, it } from 'vitest'

function createStore(overrides?: { firstName?: string; lastName?: string }) {
  const store = new Store({
    firstName: overrides?.firstName ?? 'Jane',
    lastName: overrides?.lastName ?? 'Smith',
  })
  const fullName = new Derived({
    fn: () => `${store.state.firstName} ${store.state.lastName}`,
    deps: [store],
  })
  fullName.mount()
  return { store, fullName }
}

describe('demo-store', () => {
  it('should have correct initial state', () => {
    // Arrange
    const { store } = createStore()

    // Act & Assert
    expect(store.state.firstName).toBe('Jane')
    expect(store.state.lastName).toBe('Smith')
  })

  it('should derive fullName from firstName and lastName', () => {
    // Arrange
    const { fullName } = createStore()

    // Act & Assert
    expect(fullName.state).toBe('Jane Smith')
  })

  it('should update fullName when firstName changes', () => {
    // Arrange
    const { store, fullName } = createStore()

    // Act
    store.setState((prev) => ({ ...prev, firstName: 'John' }))

    // Assert
    expect(fullName.state).toBe('John Smith')
  })

  it('should update fullName when lastName changes', () => {
    // Arrange
    const { store, fullName } = createStore()

    // Act
    store.setState((prev) => ({ ...prev, lastName: 'Doe' }))

    // Assert
    expect(fullName.state).toBe('Jane Doe')
  })
})
