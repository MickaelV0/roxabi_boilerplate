import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState variants', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState icon={<span>icon</span>} description="No items found." />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toBeInTheDocument()
  })

  it('should apply default variant when no variant is specified', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState icon={<span>icon</span>} description="No items found." />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveAttribute(
      'data-variant',
      'default'
    )
  })

  it('should apply error variant when variant is error', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState icon={<span>icon</span>} description="Something went wrong." variant="error" />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveAttribute(
      'data-variant',
      'error'
    )
  })

  it('should apply search variant when variant is search', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState
        icon={<span>icon</span>}
        description="No results match your search."
        variant="search"
      />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveAttribute(
      'data-variant',
      'search'
    )
  })
})

describe('EmptyState props', () => {
  it('should render description text', () => {
    // Arrange & Act
    render(<EmptyState icon={<span>icon</span>} description="No items found." />)

    // Assert
    expect(screen.getByText('No items found.')).toBeInTheDocument()
  })

  it('should render the icon', () => {
    // Arrange & Act
    render(<EmptyState icon={<span data-testid="test-icon">icon</span>} description="No items." />)

    // Assert
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should not render title when title is not provided', () => {
    // Arrange & Act
    render(<EmptyState icon={<span>icon</span>} description="No items found." />)

    // Assert
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('should render title when title is provided', () => {
    // Arrange & Act
    render(<EmptyState icon={<span>icon</span>} title="No items" description="No items found." />)

    // Assert
    expect(screen.getByText('No items')).toBeInTheDocument()
  })

  it('should not render action when action is not provided', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState icon={<span>icon</span>} description="No items found." />
    )

    // Assert
    expect(container.querySelector('button')).not.toBeInTheDocument()
  })

  it('should render action when action is provided', () => {
    // Arrange & Act
    render(
      <EmptyState
        icon={<span>icon</span>}
        description="No items found."
        action={<button type="button">Create item</button>}
      />
    )

    // Assert
    expect(screen.getByRole('button', { name: 'Create item' })).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState icon={<span>icon</span>} description="No items found." className="custom-class" />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveClass('custom-class')
  })
})

describe('EmptyState composed', () => {
  it('should render a full empty state with icon, title, description and action', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState
        icon={<span data-testid="composed-icon">icon</span>}
        title="No organizations"
        description="Create your first organization to get started."
        action={<button type="button">Create organization</button>}
        variant="default"
      />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toBeInTheDocument()
    expect(screen.getByTestId('composed-icon')).toBeInTheDocument()
    expect(screen.getByText('No organizations')).toBeInTheDocument()
    expect(screen.getByText('Create your first organization to get started.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create organization' })).toBeInTheDocument()
  })

  it('should render a minimal empty state with only required props', () => {
    // Arrange & Act
    const { container } = render(
      <EmptyState
        icon={<span data-testid="minimal-icon">icon</span>}
        description="No audit logs yet."
      />
    )

    // Assert
    expect(container.querySelector('[data-slot="empty-state"]')).toBeInTheDocument()
    expect(screen.getByTestId('minimal-icon')).toBeInTheDocument()
    expect(screen.getByText('No audit logs yet.')).toBeInTheDocument()
    expect(container.querySelector('button')).not.toBeInTheDocument()
  })
})
