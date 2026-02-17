import type { ConsentCategories } from '@repo/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', async () => {
  const mocks = await import('@/test/__mocks__/repo-ui')
  return {
    ...mocks,
    // Override Dialog to respect `open` prop
    Dialog: ({ children, open }: React.PropsWithChildren<{ open?: boolean }>) =>
      open ? <div data-testid="dialog">{children}</div> : null,
    Separator: () => <hr />,
    Switch: ({
      checked,
      disabled,
      onCheckedChange,
      ...props
    }: {
      checked?: boolean
      disabled?: boolean
      onCheckedChange?: (v: boolean) => void
      [key: string]: unknown
    }) => (
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
  }
})

import { ConsentModal } from './ConsentModal'

describe('ConsentModal', () => {
  const defaultCategories: ConsentCategories = {
    necessary: true,
    analytics: false,
    marketing: false,
  }
  const mockOnSave = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render category toggles when open', () => {
    // Arrange & Act
    render(
      <ConsentModal
        open={true}
        onOpenChange={mockOnOpenChange}
        categories={defaultCategories}
        onSave={mockOnSave}
      />
    )

    // Assert
    expect(screen.getByText(/n[ée]cessaires/i)).toBeInTheDocument()
    expect(screen.getByText(/analytiques/i)).toBeInTheDocument()
    expect(screen.getByText(/marketing/i)).toBeInTheDocument()
  })

  it('should not render when open is false', () => {
    // Arrange & Act
    const { container } = render(
      <ConsentModal
        open={false}
        onOpenChange={mockOnOpenChange}
        categories={defaultCategories}
        onSave={mockOnSave}
      />
    )

    // Assert
    expect(container.firstChild).toBeNull()
  })

  it('should have the necessary toggle always on and disabled', () => {
    // Arrange & Act
    render(
      <ConsentModal
        open={true}
        onOpenChange={mockOnOpenChange}
        categories={defaultCategories}
        onSave={mockOnSave}
      />
    )

    // Assert — the necessary switch should be checked and disabled
    const switches = screen.getAllByRole('switch')
    // First switch is "necessary" — should be checked and disabled
    const necessarySwitch = switches[0]
    expect(necessarySwitch).toBeChecked()
    expect(necessarySwitch).toBeDisabled()
  })

  it('should call onSave when save button is clicked', () => {
    // Arrange
    render(
      <ConsentModal
        open={true}
        onOpenChange={mockOnOpenChange}
        categories={defaultCategories}
        onSave={mockOnSave}
      />
    )

    // Act
    const saveButton = screen.getByRole('button', { name: /enregistrer/i })
    fireEvent.click(saveButton)

    // Assert
    expect(mockOnSave).toHaveBeenCalledOnce()
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        necessary: true,
      })
    )
  })
})
