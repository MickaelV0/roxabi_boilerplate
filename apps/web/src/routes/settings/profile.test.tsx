import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

vi.mock('@/lib/auth-client', () => ({
  authClient: {},
  useSession: vi.fn(() => ({
    data: {
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    },
  })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@dicebear/core', () => ({
  createAvatar: () => ({
    toString: () => '<svg>mock</svg>',
  }),
}))

vi.mock('@dicebear/lorelei', () => ({ lorelei: {} }))
vi.mock('@dicebear/bottts', () => ({ bottts: {} }))
vi.mock('@dicebear/pixel-art', () => ({ pixelArt: {} }))
vi.mock('@dicebear/thumbs', () => ({ thumbs: {} }))
vi.mock('@dicebear/avataaars', () => ({ avataaars: {} }))

mockParaglideMessages()

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Import after mocks to trigger createFileRoute and capture the component
import { toast } from 'sonner'
import './profile'

function setupFetchProfile(data: Record<string, unknown> = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        fullNameCustomized: false,
        avatarSeed: 'user-1',
        avatarStyle: 'lorelei',
        ...data,
      }),
  })
}

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display firstName, lastName, and fullName fields', async () => {
    setupFetchProfile()
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
  })

  it('should populate fields from API data', async () => {
    setupFetchProfile({ firstName: 'John', lastName: 'Smith', fullName: 'John Smith' })
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveValue('John')
    })
    expect(screen.getByLabelText('Last Name')).toHaveValue('Smith')
    expect(screen.getByLabelText('Display Name')).toHaveValue('John Smith')
  })

  it('should auto-update fullName when firstName or lastName changes (unless customized)', async () => {
    setupFetchProfile()
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveValue('Jane')
    })

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })

    await waitFor(() => {
      expect(screen.getByLabelText('Display Name')).toHaveValue('John Doe')
    })
  })

  it('should display DiceBear avatar selector with style options', async () => {
    setupFetchProfile()
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByText('Style')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Seed')).toBeInTheDocument()
    // Verify style options are rendered
    expect(screen.getByText('Lorelei')).toBeInTheDocument()
    expect(screen.getByText('Bottts')).toBeInTheDocument()
  })

  it('should save profile changes via PATCH api/users/me', async () => {
    // Setup mock to respond based on HTTP method
    mockFetch.mockImplementation((_url: string, opts?: { method?: string }) => {
      if (opts?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }
      // Default GET for profile load
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            firstName: 'Jane',
            lastName: 'Doe',
            fullName: 'Jane Doe',
            fullNameCustomized: false,
            avatarSeed: 'user-1',
            avatarStyle: 'lorelei',
          }),
      })
    })

    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveValue('Jane')
    })

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Janet' } })

    const form = screen.getByLabelText('First Name').closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Profile updated successfully')
    })
  })
})
