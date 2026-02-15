import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    disabled,
    ...props
  }: React.PropsWithChildren<{ disabled?: boolean; type?: 'button' | 'submit' | 'reset' }>) => (
    <button disabled={disabled} type={props.type}>
      {children}
    </button>
  ),
  Input: ({
    value,
    placeholder,
    ...props
  }: {
    value?: string
    placeholder?: string
    onBlur?: () => void
    onChange?: (e: unknown) => void
  }) => (
    <input
      value={value}
      placeholder={placeholder}
      onChange={props.onChange}
      onBlur={props.onBlur}
    />
  ),
  Label: ({
    children,
    htmlFor,
  }: React.PropsWithChildren<{ htmlFor?: string; className?: string }>) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Textarea: ({
    id,
    value,
    rows,
    ...props
  }: {
    id?: string
    value?: string
    rows?: number
    onBlur?: () => void
    onChange?: (e: unknown) => void
  }) => (
    <textarea id={id} value={value} rows={rows} onChange={props.onChange} onBlur={props.onBlur} />
  ),
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren<{ value: string }>) => <div>{children}</div>,
  SelectLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  Slider: () => <div role="slider" tabIndex={0} aria-label="slider" aria-valuenow={0} />,
  Switch: ({
    id,
    checked,
  }: {
    id?: string
    checked?: boolean
    onBlur?: () => void
    onCheckedChange?: (v: boolean) => void
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      readOnly
      role="switch"
      aria-checked={checked}
      aria-label={id}
    />
  ),
}))

// Mock the form context hooks
const mockFieldState = {
  value: 'test value',
  meta: { isTouched: false, errors: [] },
}

const mockField = {
  state: mockFieldState,
  store: {
    subscribe: vi.fn(() => vi.fn()),
    getState: () => ({ meta: { errors: [] } }),
  },
  name: 'testField',
  handleBlur: vi.fn(),
  handleChange: vi.fn(),
}

vi.mock('@/hooks/demo.form-context', () => ({
  useFieldContext: () => mockField,
  useFormContext: () => ({
    Subscribe: ({
      children,
    }: {
      children: (isSubmitting: boolean) => React.ReactNode
      selector: (state: unknown) => unknown
    }) => <>{children(false)}</>,
  }),
}))

vi.mock('@tanstack/react-form', () => ({
  useStore: (_store: unknown, selector: (state: unknown) => unknown) =>
    selector({ meta: { errors: [] } }),
}))

import { Select, Slider, SubscribeButton, Switch, TextArea, TextField } from './demo.FormComponents'

describe('demo.FormComponents', () => {
  describe('SubscribeButton', () => {
    it('should render a submit button with the given label', () => {
      // Arrange & Act
      render(<SubscribeButton label="Subscribe" />)

      // Assert
      const button = screen.getByRole('button', { name: 'Subscribe' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should render with the button not disabled when not submitting', () => {
      // Arrange & Act
      render(<SubscribeButton label="Submit" />)

      // Assert
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).not.toBeDisabled()
    })
  })

  describe('TextField', () => {
    it('should render a label', () => {
      // Arrange & Act
      render(<TextField label="Email" />)

      // Assert
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should render an input with the field value', () => {
      // Arrange & Act
      render(<TextField label="Name" placeholder="Enter name" />)

      // Assert
      const input = screen.getByPlaceholderText('Enter name')
      expect(input).toBeInTheDocument()
    })
  })

  describe('TextArea', () => {
    it('should render a label', () => {
      // Arrange & Act
      render(<TextArea label="Message" />)

      // Assert
      expect(screen.getByText('Message')).toBeInTheDocument()
    })

    it('should render a textarea element', () => {
      // Arrange & Act
      render(<TextArea label="Comments" rows={5} />)

      // Assert
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Select', () => {
    it('should render a select with placeholder', () => {
      // Arrange & Act
      render(
        <Select
          label="Country"
          values={[
            { label: 'USA', value: 'us' },
            { label: 'Canada', value: 'ca' },
          ]}
          placeholder="Select a country"
        />
      )

      // Assert
      expect(screen.getByText('Select a country')).toBeInTheDocument()
    })

    it('should render select items', () => {
      // Arrange & Act
      render(
        <Select
          label="Color"
          values={[
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' },
          ]}
        />
      )

      // Assert
      expect(screen.getByText('Red')).toBeInTheDocument()
      expect(screen.getByText('Blue')).toBeInTheDocument()
    })
  })

  describe('Slider', () => {
    it('should render a slider with label', () => {
      // Arrange & Act
      render(<Slider label="Volume" />)

      // Assert
      expect(screen.getByText('Volume')).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Switch', () => {
    it('should render a switch with label', () => {
      // Arrange & Act
      render(<Switch label="Notifications" />)

      // Assert
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })
})
