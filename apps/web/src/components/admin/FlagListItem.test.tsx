import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repoUi'))

import { FlagListItem } from './FlagListItem'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFlag(
  overrides: Partial<{
    id: string
    name: string
    key: string
    description: string | null
    enabled: boolean
    createdAt: string
    updatedAt: string
  }> = {}
) {
  return {
    id: overrides.id ?? 'flag-1',
    name: overrides.name ?? 'My Feature',
    key: overrides.key ?? 'my-feature',
    description: overrides.description ?? null,
    enabled: overrides.enabled ?? false,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00Z',
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FlagListItem', () => {
  const onToggle = vi.fn().mockResolvedValue(undefined)
  const onDelete = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render flag name and key', () => {
    // Arrange + Act
    render(<FlagListItem flag={createFlag()} onToggle={onToggle} onDelete={onDelete} />)

    // Assert
    expect(screen.getByText('My Feature')).toBeInTheDocument()
    expect(screen.getByText('my-feature')).toBeInTheDocument()
  })

  it('should render description when present', () => {
    // Arrange + Act
    render(
      <FlagListItem
        flag={createFlag({ description: 'Controls new UI' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    // Assert
    expect(screen.getByText('Controls new UI')).toBeInTheDocument()
  })

  it('should not render description when null', () => {
    // Arrange + Act
    render(
      <FlagListItem
        flag={createFlag({ description: null })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    // Assert — only name and key should be visible text
    expect(screen.getByText('My Feature')).toBeInTheDocument()
    expect(screen.getByText('my-feature')).toBeInTheDocument()
    expect(screen.queryByText('Controls new UI')).not.toBeInTheDocument()
  })

  it('should render a switch reflecting the enabled state', () => {
    // Arrange + Act
    render(
      <FlagListItem flag={createFlag({ enabled: true })} onToggle={onToggle} onDelete={onDelete} />
    )

    // Assert
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toBeInTheDocument()
  })

  it('should call onToggle with inverted enabled when switch is clicked', async () => {
    // Arrange
    render(
      <FlagListItem
        flag={createFlag({ id: 'flag-1', enabled: false })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    // Act
    fireEvent.click(screen.getByRole('switch'))

    // Assert
    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith('flag-1', true)
    })
  })

  it('should render a delete button', () => {
    // Arrange + Act
    render(<FlagListItem flag={createFlag()} onToggle={onToggle} onDelete={onDelete} />)

    // Assert — sr-only text "Delete My Feature" on the icon button
    expect(screen.getByRole('button', { name: /delete my feature/i })).toBeInTheDocument()
  })

  it('should render delete confirmation dialog content', () => {
    // Arrange + Act — mock AlertDialog renders children directly
    render(<FlagListItem flag={createFlag()} onToggle={onToggle} onDelete={onDelete} />)

    // Assert
    expect(screen.getByText('Delete feature flag')).toBeInTheDocument()
    expect(screen.getByText(/default to/)).toBeInTheDocument()
  })

  it('should call onDelete when delete is confirmed', async () => {
    // Arrange
    render(
      <FlagListItem flag={createFlag({ id: 'flag-1' })} onToggle={onToggle} onDelete={onDelete} />
    )

    // Act — click the Delete action button in the dialog
    const deleteAction = screen.getByRole('button', { name: /^delete$/i })
    fireEvent.click(deleteAction)

    // Assert
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('flag-1')
    })
  })
})
