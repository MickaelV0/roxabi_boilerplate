import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './Sheet'

describe('Sheet', () => {
  it('should render trigger and open sheet content', () => {
    // Arrange
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet description text</SheetDescription>
          </SheetHeader>
          <p>Sheet body content</p>
          <SheetFooter>
            <button type="button">Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    // Assert
    expect(screen.getByText('Sheet Title')).toBeInTheDocument()
    expect(screen.getByText('Sheet description text')).toBeInTheDocument()
    expect(screen.getByText('Sheet body content')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should render the close button with accessible label', () => {
    // Arrange
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    // Assert
    expect(screen.getByText('Close')).toBeInTheDocument()
    expect(screen.getByText('Close')).toHaveClass('sr-only')
  })

  it('should apply data-slot attributes', () => {
    // Arrange
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          <SheetFooter>Footer</SheetFooter>
        </SheetContent>
      </Sheet>
    )

    // Assert
    expect(document.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-title"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-description"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-footer"]')).toBeInTheDocument()
  })

  it('should accept a custom className on SheetContent', () => {
    // Arrange
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent className="custom-class">
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    // Assert
    const content = document.querySelector('[data-slot="sheet-content"]')
    expect(content).toHaveClass('custom-class')
  })

  it('should render the trigger button', () => {
    // Arrange
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    // Assert
    expect(screen.getByText('Open Sheet')).toBeInTheDocument()
  })
})
