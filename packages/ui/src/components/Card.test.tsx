import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    expect(container.querySelector('[data-slot="card"]')).toHaveClass('custom-class')
  })

  it('uses default variant by default', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toHaveAttribute('data-variant', 'default')
    expect(card).toHaveClass('shadow-sm')
  })

  it('applies subtle variant', () => {
    const { container } = render(<Card variant="subtle">Content</Card>)
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toHaveAttribute('data-variant', 'subtle')
    expect(card).toHaveClass('bg-card/50')
    expect(card).not.toHaveClass('shadow-sm')
  })
})

describe('CardHeader', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('renders title text', () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    expect(container.querySelector('[data-slot="card-title"]')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('renders description text', () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<CardDescription>Desc</CardDescription>)
    expect(container.querySelector('[data-slot="card-description"]')).toBeInTheDocument()
  })
})

describe('CardAction', () => {
  it('has data-slot attribute', () => {
    const { container } = render(<CardAction>Action</CardAction>)
    expect(container.querySelector('[data-slot="card-action"]')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('renders content', () => {
    render(<CardContent>Body content</CardContent>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('renders footer content', () => {
    render(<CardFooter>Footer</CardFooter>)
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    expect(container.querySelector('[data-slot="card-footer"]')).toBeInTheDocument()
  })
})

describe('Card composed', () => {
  it('renders a full card with all subcomponents', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
