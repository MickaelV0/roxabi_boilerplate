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
  it('should render children correctly', () => {
    // Arrange & Act
    render(<Card>Card content</Card>)

    // Assert
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Card>Content</Card>)

    // Assert
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<Card className="custom-class">Content</Card>)

    // Assert
    expect(container.querySelector('[data-slot="card"]')).toHaveClass('custom-class')
  })

  it('should use default variant by default', () => {
    // Arrange & Act
    const { container } = render(<Card>Content</Card>)

    // Assert
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toHaveAttribute('data-variant', 'default')
  })

  it('should apply subtle variant when variant is subtle', () => {
    // Arrange & Act
    const { container } = render(<Card variant="subtle">Content</Card>)

    // Assert
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toHaveAttribute('data-variant', 'subtle')
  })
})

describe('CardHeader', () => {
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<CardHeader>Header</CardHeader>)

    // Assert
    expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('should render title text', () => {
    // Arrange & Act
    render(<CardTitle>My Title</CardTitle>)

    // Assert
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<CardTitle>Title</CardTitle>)

    // Assert
    expect(container.querySelector('[data-slot="card-title"]')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('should render description text', () => {
    // Arrange & Act
    render(<CardDescription>Description text</CardDescription>)

    // Assert
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<CardDescription>Desc</CardDescription>)

    // Assert
    expect(container.querySelector('[data-slot="card-description"]')).toBeInTheDocument()
  })
})

describe('CardAction', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<CardAction>Action</CardAction>)

    // Assert
    expect(container.querySelector('[data-slot="card-action"]')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('should render content', () => {
    // Arrange & Act
    render(<CardContent>Body content</CardContent>)

    // Assert
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<CardContent>Content</CardContent>)

    // Assert
    expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('should render footer content', () => {
    // Arrange & Act
    render(<CardFooter>Footer</CardFooter>)

    // Assert
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<CardFooter>Footer</CardFooter>)

    // Assert
    expect(container.querySelector('[data-slot="card-footer"]')).toBeInTheDocument()
  })
})

describe('Card composed', () => {
  it('should render a full card with all subcomponents', () => {
    // Arrange & Act
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

    // Assert
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
