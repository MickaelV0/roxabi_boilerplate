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
  authClient: {
    getSession: vi.fn(() => Promise.resolve({})),
  },
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

vi.mock('@dicebear/lorelei', () => ({ lorelei: {}, schema: { properties: {} } }))
vi.mock('@dicebear/bottts', () => ({ bottts: {}, schema: { properties: {} } }))
vi.mock('@dicebear/pixel-art', () => ({ pixelArt: {}, schema: { properties: {} } }))
vi.mock('@dicebear/thumbs', () => ({ thumbs: {}, schema: { properties: {} } }))
vi.mock('@dicebear/avataaars', () => ({ avataaars: {}, schema: { properties: {} } }))
vi.mock('@dicebear/adventurer', () => ({ adventurer: {}, schema: { properties: {} } }))
vi.mock('@dicebear/toon-head', () => ({ toonHead: {}, schema: { properties: {} } }))

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
        avatarOptions: {},
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
      expect(screen.getByLabelText('profile_first_name')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('profile_last_name')).toBeInTheDocument()
    expect(screen.getByLabelText('profile_display_name')).toBeInTheDocument()
  })

  it('should populate fields from API data', async () => {
    setupFetchProfile({ firstName: 'John', lastName: 'Smith', fullName: 'John Smith' })
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('profile_first_name')).toHaveValue('John')
    })
    expect(screen.getByLabelText('profile_last_name')).toHaveValue('Smith')
    expect(screen.getByLabelText('profile_display_name')).toHaveValue('John Smith')
  })

  it('should auto-update fullName when firstName or lastName changes (unless customized)', async () => {
    setupFetchProfile()
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('profile_first_name')).toHaveValue('Jane')
    })

    fireEvent.change(screen.getByLabelText('profile_first_name'), {
      target: { value: 'John' },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('profile_display_name')).toHaveValue('John Doe')
    })
  })

  it('should display DiceBear avatar selector with style options', async () => {
    setupFetchProfile()
    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByText('avatar_style_label')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('avatar_seed_label')).toBeInTheDocument()
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
            avatarOptions: {},
          }),
      })
    })

    const Profile = captured.Component
    render(<Profile />)

    await waitFor(() => {
      expect(screen.getByLabelText('profile_first_name')).toHaveValue('Jane')
    })

    fireEvent.change(screen.getByLabelText('profile_first_name'), {
      target: { value: 'Janet' },
    })

    const form = screen.getByLabelText('profile_first_name').closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('avatar_save_success')
    })
  })
})
