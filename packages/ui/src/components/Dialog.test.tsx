import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog'

function renderDialog({ showCloseButton = true }: { showCloseButton?: boolean } = {}) {
  return render(
    <Dialog>
      <DialogTrigger>Open Dialog</DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description text</DialogDescription>
        </DialogHeader>
        <p>Dialog body</p>
        <DialogFooter>Footer content</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('should render trigger button', () => {
    // Arrange & Act
    renderDialog()

    // Assert
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('should not show content initially', () => {
    // Arrange & Act
    renderDialog()

    // Assert
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('should show content when trigger is clicked', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.click(screen.getByText('Open Dialog'))

    // Assert
    expect(screen.getByText('Dialog Title')).toBeVisible()
    expect(screen.getByText('Dialog description text')).toBeVisible()
    expect(screen.getByText('Dialog body')).toBeVisible()
  })

  it('should show close button by default', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.click(screen.getByText('Open Dialog'))

    // Assert
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('should hide close button when showCloseButton is false', () => {
    // Arrange
    renderDialog({ showCloseButton: false })

    // Act
    fireEvent.click(screen.getByText('Open Dialog'))

    // Assert
    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  it('should have data-slot attributes on content elements when open', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.click(screen.getByText('Open Dialog'))

    // Assert
    const content = document.querySelector('[data-slot="dialog-content"]')
    expect(content).toBeInTheDocument()
  })

  it('should render dialog title with correct role', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.click(screen.getByText('Open Dialog'))

    // Assert
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dialog Title')
  })
})

describe('DialogHeader', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<DialogHeader>Header</DialogHeader>)

    // Assert
    expect(container.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument()
  })
})

describe('DialogFooter', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<DialogFooter>Footer</DialogFooter>)

    // Assert
    expect(container.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument()
  })

  it('should render children', () => {
    // Arrange & Act
    render(<DialogFooter>Footer text</DialogFooter>)

    // Assert
    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })
})
