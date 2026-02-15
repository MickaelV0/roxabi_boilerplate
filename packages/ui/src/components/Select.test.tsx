import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'

function renderSelect({ open }: { open?: boolean } = {}) {
  return render(
    <Select open={open}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  it('should render trigger with placeholder', () => {
    // Arrange & Act
    renderSelect()

    // Assert
    expect(screen.getByText('Select a fruit')).toBeInTheDocument()
  })

  it('should have data-slot on trigger when rendered', () => {
    // Arrange & Act
    renderSelect()

    // Assert
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger')
  })

  it('should have combobox role on trigger', () => {
    // Arrange & Act
    renderSelect()

    // Assert
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should apply default size when no size is specified', () => {
    // Arrange & Act
    renderSelect()

    // Assert
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('data-size', 'default')
  })

  it('should apply sm size when size is sm', () => {
    // Arrange & Act
    render(
      <Select>
        <SelectTrigger size="sm" aria-label="Fruit">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>
    )

    // Assert
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm')
  })

  it('should apply custom className to trigger when provided', () => {
    // Arrange & Act
    render(
      <Select>
        <SelectTrigger className="custom-class" aria-label="Fruit">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>
    )

    // Assert
    expect(screen.getByRole('combobox')).toHaveClass('custom-class')
  })

  it('should render selected value when controlled', () => {
    // Arrange & Act
    render(
      <Select value="banana">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    )

    // Assert
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })
})
