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
  it('renders trigger button', () => {
    renderDialog()
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('does not show content initially', () => {
    renderDialog()
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('shows content when trigger is clicked', () => {
    renderDialog()
    fireEvent.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Dialog Title')).toBeVisible()
    expect(screen.getByText('Dialog description text')).toBeVisible()
    expect(screen.getByText('Dialog body')).toBeVisible()
  })

  it('shows close button by default', () => {
    renderDialog()
    fireEvent.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('hides close button when showCloseButton is false', () => {
    renderDialog({ showCloseButton: false })
    fireEvent.click(screen.getByText('Open Dialog'))
    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  it('has data-slot attributes on content elements', () => {
    renderDialog()
    fireEvent.click(screen.getByText('Open Dialog'))
    const content = document.querySelector('[data-slot="dialog-content"]')
    expect(content).toBeInTheDocument()
  })

  it('renders dialog title with correct role', () => {
    renderDialog()
    fireEvent.click(screen.getByText('Open Dialog'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dialog Title')
  })
})

describe('DialogHeader', () => {
  it('has data-slot attribute', () => {
    const { container } = render(<DialogHeader>Header</DialogHeader>)
    expect(container.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument()
  })
})

describe('DialogFooter', () => {
  it('has data-slot attribute', () => {
    const { container } = render(<DialogFooter>Footer</DialogFooter>)
    expect(container.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<DialogFooter>Footer text</DialogFooter>)
    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })
})
