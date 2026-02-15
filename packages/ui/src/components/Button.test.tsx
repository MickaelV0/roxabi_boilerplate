import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('should render children correctly', () => {
    // Arrange & Act
    render(<Button>Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should call onClick when clicked', () => {
    // Arrange
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    // Act
    fireEvent.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should apply default variant by default', () => {
    // Arrange & Act
    render(<Button>Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'default')
  })

  it('should apply secondary variant when specified', () => {
    // Arrange & Act
    render(<Button variant="secondary">Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')
  })

  it('should apply destructive variant when specified', () => {
    // Arrange & Act
    render(<Button variant="destructive">Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'destructive')
  })

  it('should apply outline variant when specified', () => {
    // Arrange & Act
    render(<Button variant="outline">Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'outline')
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    render(<Button disabled>Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should not call onClick when disabled', () => {
    // Arrange
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    )

    // Act
    fireEvent.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should apply size variants when size is specified', () => {
    // Arrange & Act
    render(<Button size="sm">Small</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    render(<Button>Click me</Button>)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button')
  })
})
