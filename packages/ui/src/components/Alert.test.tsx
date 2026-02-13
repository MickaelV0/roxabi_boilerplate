import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from './Alert'

describe('Alert', () => {
  it('renders children correctly', () => {
    // Arrange & Act
    render(<Alert>Alert content</Alert>)

    // Assert
    expect(screen.getByText('Alert content')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    // Arrange & Act
    const { container } = render(<Alert>Content</Alert>)

    // Assert
    expect(container.querySelector('[data-slot="alert"]')).toBeInTheDocument()
  })

  it('has role="alert"', () => {
    // Arrange & Act
    render(<Alert>Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    // Arrange & Act
    render(<Alert className="custom-class">Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toHaveClass('custom-class')
  })

  it('applies default variant', () => {
    // Arrange & Act
    render(<Alert>Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'default')
  })

  it('applies destructive variant', () => {
    // Arrange & Act
    render(<Alert variant="destructive">Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'destructive')
  })
})

describe('AlertTitle', () => {
  it('renders title text', () => {
    // Arrange & Act
    render(<AlertTitle>My Title</AlertTitle>)

    // Assert
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    // Arrange & Act
    const { container } = render(<AlertTitle>Title</AlertTitle>)

    // Assert
    expect(container.querySelector('[data-slot="alert-title"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    // Arrange & Act
    const { container } = render(<AlertTitle className="custom-title">Title</AlertTitle>)

    // Assert
    expect(container.querySelector('[data-slot="alert-title"]')).toHaveClass('custom-title')
  })
})

describe('AlertDescription', () => {
  it('renders description text', () => {
    // Arrange & Act
    render(<AlertDescription>Description text</AlertDescription>)

    // Assert
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    // Arrange & Act
    const { container } = render(<AlertDescription>Desc</AlertDescription>)

    // Assert
    expect(container.querySelector('[data-slot="alert-description"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    // Arrange & Act
    const { container } = render(<AlertDescription className="custom-desc">Desc</AlertDescription>)

    // Assert
    expect(container.querySelector('[data-slot="alert-description"]')).toHaveClass('custom-desc')
  })
})

describe('Alert composed', () => {
  it('renders a full alert with all subcomponents', () => {
    // Arrange & Act
    const { container } = render(
      <Alert>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    )

    // Assert
    expect(container.querySelector('[data-slot="alert"]')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })
})
