import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from './Alert'

describe('Alert', () => {
  it('renders children correctly', () => {
    render(<Alert>Alert content</Alert>)
    expect(screen.getByText('Alert content')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Alert>Content</Alert>)
    expect(container.querySelector('[data-slot="alert"]')).toBeInTheDocument()
  })

  it('has role="alert"', () => {
    render(<Alert>Content</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-class">Content</Alert>)
    expect(container.querySelector('[data-slot="alert"]')).toHaveClass('custom-class')
  })

  it('applies default variant', () => {
    const { container } = render(<Alert>Content</Alert>)
    expect(container.querySelector('[data-slot="alert"]')).toHaveAttribute(
      'data-variant',
      'default'
    )
  })

  it('applies destructive variant', () => {
    const { container } = render(<Alert variant="destructive">Content</Alert>)
    expect(container.querySelector('[data-slot="alert"]')).toHaveAttribute(
      'data-variant',
      'destructive'
    )
  })
})

describe('AlertTitle', () => {
  it('renders title text', () => {
    render(<AlertTitle>My Title</AlertTitle>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<AlertTitle>Title</AlertTitle>)
    expect(container.querySelector('[data-slot="alert-title"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<AlertTitle className="custom-title">Title</AlertTitle>)
    expect(container.querySelector('[data-slot="alert-title"]')).toHaveClass('custom-title')
  })
})

describe('AlertDescription', () => {
  it('renders description text', () => {
    render(<AlertDescription>Description text</AlertDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<AlertDescription>Desc</AlertDescription>)
    expect(container.querySelector('[data-slot="alert-description"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<AlertDescription className="custom-desc">Desc</AlertDescription>)
    expect(container.querySelector('[data-slot="alert-description"]')).toHaveClass('custom-desc')
  })
})

describe('Alert composed', () => {
  it('renders a full alert with all subcomponents', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    )
    expect(container.querySelector('[data-slot="alert"]')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })
})
