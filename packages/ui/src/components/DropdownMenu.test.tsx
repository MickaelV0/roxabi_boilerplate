import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './DropdownMenu'

function renderDropdownMenu({ open }: { open?: boolean } = {}) {
  return render(
    <DropdownMenu open={open}>
      <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Edit <DropdownMenuShortcut>Ctrl+E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenu', () => {
  it('should render trigger', () => {
    // Arrange & Act
    renderDropdownMenu()

    // Assert
    expect(screen.getByText('Open Menu')).toBeInTheDocument()
  })

  it('should have correct role on trigger', () => {
    // Arrange & Act
    renderDropdownMenu()

    // Assert
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should not show content initially', () => {
    // Arrange & Act
    renderDropdownMenu()

    // Assert
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('should have data-slot on trigger when rendered', () => {
    // Arrange & Act
    renderDropdownMenu()

    // Assert
    const trigger = screen.getByText('Open Menu')
    expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger')
  })

  it('should show content when controlled open', () => {
    // Arrange & Act
    renderDropdownMenu({ open: true })

    // Assert
    expect(screen.getByText('Edit')).toBeVisible()
    expect(screen.getByText('Delete')).toBeVisible()
  })

  it('should render label in menu content when open', () => {
    // Arrange & Act
    renderDropdownMenu({ open: true })

    // Assert
    expect(screen.getByText('Actions')).toBeVisible()
  })

  it('should render shortcut text when open', () => {
    // Arrange & Act
    renderDropdownMenu({ open: true })

    // Assert
    expect(screen.getByText('Ctrl+E')).toBeVisible()
  })

  it('should apply destructive variant to menu items', () => {
    // Arrange & Act
    renderDropdownMenu({ open: true })

    // Assert
    const deleteItem = screen.getByText('Delete').closest('[data-slot="dropdown-menu-item"]')
    expect(deleteItem).toHaveAttribute('data-variant', 'destructive')
  })
})

describe('DropdownMenuCheckboxItem', () => {
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Option A</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    // Assert
    const item = screen.getByText('Option A').closest('[data-slot="dropdown-menu-checkbox-item"]')
    expect(item).toBeInTheDocument()
  })
})

describe('DropdownMenuRadioGroup and DropdownMenuRadioItem', () => {
  it('should render radio items with data-slot attribute', () => {
    // Arrange & Act
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Choice A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Choice B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    // Assert
    const itemA = screen.getByText('Choice A').closest('[data-slot="dropdown-menu-radio-item"]')
    expect(itemA).toBeInTheDocument()
    expect(screen.getByText('Choice B')).toBeVisible()
  })
})

describe('DropdownMenuGroup', () => {
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Grouped Item</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    // Assert
    expect(screen.getByText('Grouped Item')).toBeVisible()
  })
})

describe('DropdownMenuSub', () => {
  it('should render sub menu with trigger and content', () => {
    // Arrange & Act
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    // Assert
    expect(screen.getByText('More')).toBeVisible()
    const subTrigger = screen.getByText('More').closest('[data-slot="dropdown-menu-sub-trigger"]')
    expect(subTrigger).toBeInTheDocument()
  })
})
