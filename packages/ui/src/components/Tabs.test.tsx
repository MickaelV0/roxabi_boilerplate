import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'

function renderTabs() {
  return render(
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1">Content 1</TabsContent>
      <TabsContent value="tab-2">Content 2</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders triggers correctly', () => {
    // Arrange & Act
    renderTabs()

    // Assert
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('has data-slot attribute on root', () => {
    // Arrange & Act
    const { container } = renderTabs()

    // Assert
    expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument()
  })

  it('has data-slot attribute on tabs-list', () => {
    // Arrange & Act
    const { container } = renderTabs()

    // Assert
    expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument()
  })

  it('has data-slot attribute on tabs-trigger', () => {
    // Arrange & Act
    const { container } = renderTabs()

    // Assert
    const triggers = container.querySelectorAll('[data-slot="tabs-trigger"]')
    expect(triggers).toHaveLength(2)
  })

  it('has data-slot attribute on tabs-content', () => {
    // Arrange & Act
    const { container } = renderTabs()

    // Assert
    expect(container.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument()
  })

  it('shows first tab content by default', () => {
    // Arrange & Act
    renderTabs()

    // Assert
    expect(screen.getByText('Content 1')).toBeVisible()
  })

  it('marks active trigger with aria-selected', () => {
    // Arrange & Act
    renderTabs()

    // Assert
    const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
    const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
    expect(tab1).toHaveAttribute('aria-selected', 'true')
    expect(tab2).toHaveAttribute('aria-selected', 'false')
  })

  it('applies custom className to TabsList', () => {
    // Arrange & Act
    const { container } = render(
      <Tabs defaultValue="tab-1">
        <TabsList className="custom-class">
          <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Content 1</TabsContent>
      </Tabs>
    )

    // Assert
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('applies custom className to TabsTrigger', () => {
    // Arrange & Act
    const { container } = render(
      <Tabs defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1" className="trigger-class">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Content 1</TabsContent>
      </Tabs>
    )

    // Assert
    expect(container.querySelector('.trigger-class')).toBeInTheDocument()
  })

  it('applies custom className to TabsContent', () => {
    // Arrange & Act
    const { container } = render(
      <Tabs defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1" className="content-class">
          Content 1
        </TabsContent>
      </Tabs>
    )

    // Assert
    expect(container.querySelector('.content-class')).toBeInTheDocument()
  })
})
