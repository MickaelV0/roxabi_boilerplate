import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toaster } from './Sonner'

describe('Toaster', () => {
  it('renders with data-slot attribute', () => {
    render(<Toaster data-testid="toaster" />)
    expect(screen.getByTestId('toaster')).toHaveAttribute('data-slot', 'toaster')
  })

  // TODO: add tests for toast.success / toast.error once Sonner is installed
})
