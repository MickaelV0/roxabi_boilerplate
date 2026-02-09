import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion'

function renderAccordion() {
  return render(
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content 2</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion', () => {
  it('renders triggers correctly', () => {
    renderAccordion()
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
  })

  it('has data-slot attribute on root', () => {
    const { container } = renderAccordion()
    expect(container.querySelector('[data-slot="accordion"]')).toBeInTheDocument()
  })

  it('has data-slot attribute on accordion-item', () => {
    const { container } = renderAccordion()
    const items = container.querySelectorAll('[data-slot="accordion-item"]')
    expect(items).toHaveLength(2)
  })

  it('has data-slot attribute on accordion-trigger', () => {
    const { container } = renderAccordion()
    const triggers = container.querySelectorAll('[data-slot="accordion-trigger"]')
    expect(triggers).toHaveLength(2)
  })

  it('expands content when trigger is clicked', () => {
    renderAccordion()
    const trigger = screen.getByText('Section 1')
    fireEvent.click(trigger)
    expect(screen.getByText('Content 1')).toBeVisible()
  })

  it('collapses content when trigger is clicked again', () => {
    renderAccordion()
    const trigger = screen.getByText('Section 1')
    fireEvent.click(trigger)
    expect(screen.getByText('Content 1')).toBeVisible()
    fireEvent.click(trigger)
    const _content = screen.queryByText('Content 1')
    // After collapse, content should be hidden (data-state=closed)
    expect(trigger.closest('[data-state]')).toHaveAttribute('data-state', 'closed')
  })

  it('applies custom className to AccordionItem', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="custom-class">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})
