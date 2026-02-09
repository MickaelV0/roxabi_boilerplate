import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Separator } from './Separator'

describe('Separator', () => {
  it('renders correctly', () => {
    const { container } = render(<Separator />)
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument()
  })

  it('has horizontal orientation by default', () => {
    const { container } = render(<Separator />)
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    )
  })

  it('supports vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />)
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      'data-orientation',
      'vertical'
    )
  })

  it('is decorative by default', () => {
    const { container } = render(<Separator />)
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toHaveAttribute('role', 'none')
  })

  it('renders as separator role when not decorative', () => {
    const { container } = render(<Separator decorative={false} />)
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toHaveAttribute('role', 'separator')
  })

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom-class" />)
    expect(container.querySelector('[data-slot="separator"]')).toHaveClass('custom-class')
  })
})
