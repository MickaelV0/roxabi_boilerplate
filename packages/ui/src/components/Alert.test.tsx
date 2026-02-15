import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from './Alert'

describe('Alert', () => {
  it('should render children correctly', () => {
    // Arrange & Act
    render(<Alert>Alert content</Alert>)

    // Assert
    expect(screen.getByText('Alert content')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Alert>Content</Alert>)

    // Assert
    expect(container.querySelector('[data-slot="alert"]')).toBeInTheDocument()
  })

  it('should have role="alert" when rendered', () => {
    // Arrange & Act
    render(<Alert>Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    render(<Alert className="custom-class">Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toHaveClass('custom-class')
  })

  it('should apply default variant when no variant is specified', () => {
    // Arrange & Act
    render(<Alert>Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'default')
  })

  it('should apply destructive variant when variant is destructive', () => {
    // Arrange & Act
    render(<Alert variant="destructive">Content</Alert>)

    // Assert
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'destructive')
  })
})

describe('AlertTitle', () => {
  it('should render title text', () => {
    // Arrange & Act
    render(<AlertTitle>My Title</AlertTitle>)

    // Assert
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<AlertTitle>Title</AlertTitle>)

    // Assert
    expect(container.querySelector('[data-slot="alert-title"]')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<AlertTitle className="custom-title">Title</AlertTitle>)

    // Assert
    expect(container.querySelector('[data-slot="alert-title"]')).toHaveClass('custom-title')
  })
})

describe('AlertDescription', () => {
  it('should render description text', () => {
    // Arrange & Act
    render(<AlertDescription>Description text</AlertDescription>)

    // Assert
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<AlertDescription>Desc</AlertDescription>)

    // Assert
    expect(container.querySelector('[data-slot="alert-description"]')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<AlertDescription className="custom-desc">Desc</AlertDescription>)

    // Assert
    expect(container.querySelector('[data-slot="alert-description"]')).toHaveClass('custom-desc')
  })
})

describe('Alert composed', () => {
  it('should render a full alert with all subcomponents', () => {
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
