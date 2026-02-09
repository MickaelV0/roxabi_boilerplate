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
  it('renders trigger with placeholder', () => {
    renderSelect()
    expect(screen.getByText('Select a fruit')).toBeInTheDocument()
  })

  it('has data-slot on trigger', () => {
    renderSelect()
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger')
  })

  it('trigger has combobox role', () => {
    renderSelect()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('applies default size', () => {
    renderSelect()
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('data-size', 'default')
  })

  it('applies sm size', () => {
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
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm')
  })

  it('applies custom className to trigger', () => {
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
    expect(screen.getByRole('combobox')).toHaveClass('custom-class')
  })

  it('renders selected value when controlled', () => {
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
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })
})
