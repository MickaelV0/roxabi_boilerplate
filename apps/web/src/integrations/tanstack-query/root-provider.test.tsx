import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getContext, Provider } from './root-provider'

describe('tanstack-query root-provider', () => {
  describe('getContext', () => {
    it('should return an object with queryClient', () => {
      // Arrange & Act
      const context = getContext()

      // Assert
      expect(context).toHaveProperty('queryClient')
      expect(context.queryClient).toBeDefined()
    })

    it('should return a new QueryClient instance each time', () => {
      // Arrange & Act
      const context1 = getContext()
      const context2 = getContext()

      // Assert
      expect(context1.queryClient).not.toBe(context2.queryClient)
    })
  })

  describe('Provider', () => {
    it('should render children', () => {
      // Arrange
      const { queryClient } = getContext()

      // Act
      render(
        <Provider queryClient={queryClient}>
          <div data-testid="child">Hello</div>
        </Provider>
      )

      // Assert
      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })
})
