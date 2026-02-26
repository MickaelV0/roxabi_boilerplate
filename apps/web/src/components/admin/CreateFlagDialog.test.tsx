import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repoUi'))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'
import { CreateFlagDialog } from './CreateFlagDialog'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDialog(onCreated = vi.fn()) {
  return render(<CreateFlagDialog onCreated={onCreated} />)
}

/**
 * Submit the create flag form by dispatching the submit event on the form.
 * fireEvent.click on a submit button does not reliably trigger onSubmit in jsdom
 * with React 19, so we dispatch the submit event directly on the form.
 */
function submitForm() {
  const nameInput = screen.getByLabelText('Name')
  const form = nameInput.closest('form')
  if (!form) throw new Error('No form element found around the Name input')
  fireEvent.submit(form)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateFlagDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })

  // -------------------------------------------------------------------------
  // Dialog render
  // -------------------------------------------------------------------------
  it('should render the Create Flag trigger button', () => {
    // Arrange + Act
    renderDialog()

    // Assert
    expect(screen.getByRole('button', { name: /create flag/i })).toBeInTheDocument()
  })

  it('should render dialog content with form fields', () => {
    // Arrange + Act — mock Dialog always renders children (always "open")
    renderDialog()

    // Assert
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Key')).toBeInTheDocument()
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument()
  })

  it('should render the Create flag dialog title and description', () => {
    // Arrange + Act
    renderDialog()

    // Assert
    expect(screen.getByText('Create feature flag')).toBeInTheDocument()
    expect(
      screen.getByText('Add a new feature flag to control feature availability.')
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Key auto-generation from name
  // -------------------------------------------------------------------------
  it('should auto-generate key from name when key has not been touched', () => {
    // Arrange
    renderDialog()
    const nameInput = screen.getByLabelText('Name')

    // Act
    fireEvent.change(nameInput, { target: { value: 'My New Feature' } })

    // Assert
    expect(screen.getByLabelText('Key')).toHaveValue('my-new-feature')
  })

  it('should not update key from name after key has been manually edited', () => {
    // Arrange
    renderDialog()
    const nameInput = screen.getByLabelText('Name')
    const keyInput = screen.getByLabelText('Key')

    // Act — first touch the key field
    fireEvent.change(keyInput, { target: { value: 'custom-key' } })
    // Then change the name
    fireEvent.change(nameInput, { target: { value: 'Different Name' } })

    // Assert — key should remain what the user typed
    expect(keyInput).toHaveValue('custom-key')
  })

  it('should slugify name with special characters when generating key', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Hello World 123' } })

    // Assert
    expect(screen.getByLabelText('Key')).toHaveValue('hello-world-123')
  })

  // -------------------------------------------------------------------------
  // Key validation
  // -------------------------------------------------------------------------
  it('should show validation error for key with uppercase letters', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'InvalidKey' } })

    // Assert
    expect(screen.getByText(/Key must start with a letter or number/)).toBeInTheDocument()
  })

  it('should show validation error for key starting with a dash', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: '-bad-key' } })

    // Assert
    expect(screen.getByText(/Key must start with a letter or number/)).toBeInTheDocument()
  })

  it('should show validation error for key over 100 characters on submit', async () => {
    // Arrange
    renderDialog()
    const longKey = 'a'.repeat(101)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Long key test' } })
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: longKey } })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Key must be 100 characters or fewer')).toBeInTheDocument()
    })
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/feature-flags'),
      expect.anything()
    )
  })

  it('should accept a valid key with lowercase letters, numbers, hyphens, and underscores', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'valid-key_123' } })

    // Assert — no error message should appear
    expect(screen.queryByText(/Key must start with/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Key must be/)).not.toBeInTheDocument()
  })

  it('should clear key error when user corrects the value', () => {
    // Arrange
    renderDialog()
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'BAD' } })
    expect(screen.getByText(/Key must start with a letter or number/)).toBeInTheDocument()

    // Act
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'good-key' } })

    // Assert
    expect(screen.queryByText(/Key must start with a letter or number/)).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Submit button state
  // -------------------------------------------------------------------------
  it('should disable submit button when name is empty', () => {
    // Arrange
    renderDialog()

    // Act — only set key, leave name empty
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'my-key' } })

    // Assert
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('should disable submit button when key is empty', () => {
    // Arrange
    renderDialog()

    // Act — only set name, clear any auto-generated key
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })
    // Manually clear the key after it was auto-generated
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: '' } })

    // Assert
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('should enable submit button when both name and key are provided', () => {
    // Arrange
    renderDialog()

    // Act
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })
    // Key was auto-generated from name

    // Assert
    expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled()
  })

  // -------------------------------------------------------------------------
  // Successful form submission
  // -------------------------------------------------------------------------
  it('should call POST /api/admin/feature-flags with correct payload on submit', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    globalThis.fetch = mockFetch
    const onCreated = vi.fn()
    renderDialog(onCreated)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })
    fireEvent.change(screen.getByLabelText('Description (optional)'), {
      target: { value: 'A description' },
    })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as string).includes('/api/admin/feature-flags') &&
          (call[1] as RequestInit)?.method === 'POST'
      )
      expect(calls).toHaveLength(1)
      const body = JSON.parse(calls[0]?.[1]?.body as string)
      expect(body.name).toBe('My Flag')
      expect(body.key).toBe('my-flag')
      expect(body.description).toBe('A description')
    })
  })

  it('should show success toast and call onCreated after successful submission', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    const onCreated = vi.fn()
    renderDialog(onCreated)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Feature flag created')
    })
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('should show error toast when API returns a non-ok response', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Key already exists' }),
    })
    renderDialog()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Conflict Flag' } })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Key already exists')
    })
  })

  it('should show generic error toast when API response has no message', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    })
    renderDialog()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Failed to create feature flag')
    })
  })

  it('should show error toast when fetch throws a network error', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    renderDialog()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Network error')
    })
  })

  it('should reset form to initial state after successful submission', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    renderDialog()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })
    fireEvent.change(screen.getByLabelText('Description (optional)'), {
      target: { value: 'Some desc' },
    })

    // Act
    submitForm()

    // Assert — form resets
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('')
    })
    expect(screen.getByLabelText('Key')).toHaveValue('')
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('')
  })

  it('should not call onCreated when submission fails', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error' }),
    })
    const onCreated = vi.fn()
    renderDialog(onCreated)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Flag' } })

    // Act
    submitForm()

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled()
    })
    expect(onCreated).not.toHaveBeenCalled()
  })
})
