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
  it('should render triggers correctly', () => {
    // Arrange & Act
    renderAccordion()

    // Assert
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
  })

  it('should have data-slot attribute on root when rendered', () => {
    // Arrange & Act
    const { container } = renderAccordion()

    // Assert
    expect(container.querySelector('[data-slot="accordion"]')).toBeInTheDocument()
  })

  it('should have data-slot attribute on accordion-item when rendered', () => {
    // Arrange & Act
    const { container } = renderAccordion()

    // Assert
    const items = container.querySelectorAll('[data-slot="accordion-item"]')
    expect(items).toHaveLength(2)
  })

  it('should have data-slot attribute on accordion-trigger when rendered', () => {
    // Arrange & Act
    const { container } = renderAccordion()

    // Assert
    const triggers = container.querySelectorAll('[data-slot="accordion-trigger"]')
    expect(triggers).toHaveLength(2)
  })

  it('should expand content when trigger is clicked', () => {
    // Arrange
    renderAccordion()
    const trigger = screen.getByText('Section 1')

    // Act
    fireEvent.click(trigger)

    // Assert
    expect(screen.getByText('Content 1')).toBeVisible()
  })

  it('should collapse content when trigger is clicked again', () => {
    // Arrange
    renderAccordion()
    const trigger = screen.getByText('Section 1')

    // Act
    fireEvent.click(trigger)
    expect(screen.getByText('Content 1')).toBeVisible()
    fireEvent.click(trigger)

    // Assert — use the AccordionItem data-state attribute via data-slot query
    const accordionItem = trigger.closest('[data-slot="accordion-item"]')
    expect(accordionItem).toHaveAttribute('data-state', 'closed')
  })

  it('should apply custom className to AccordionItem', () => {
    // Arrange & Act
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="custom-class">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    // Assert
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})
