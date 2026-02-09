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
  it('renders trigger', () => {
    renderDropdownMenu()
    expect(screen.getByText('Open Menu')).toBeInTheDocument()
  })

  it('trigger has correct role', () => {
    renderDropdownMenu()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('does not show content initially', () => {
    renderDropdownMenu()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('has data-slot on trigger', () => {
    renderDropdownMenu()
    const trigger = screen.getByText('Open Menu')
    expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger')
  })

  it('shows content when controlled open', () => {
    renderDropdownMenu({ open: true })
    expect(screen.getByText('Edit')).toBeVisible()
    expect(screen.getByText('Delete')).toBeVisible()
  })

  it('renders label in menu content when open', () => {
    renderDropdownMenu({ open: true })
    expect(screen.getByText('Actions')).toBeVisible()
  })

  it('renders shortcut text when open', () => {
    renderDropdownMenu({ open: true })
    expect(screen.getByText('Ctrl+E')).toBeVisible()
  })

  it('applies destructive variant to menu items', () => {
    renderDropdownMenu({ open: true })
    const deleteItem = screen.getByText('Delete').closest('[data-slot="dropdown-menu-item"]')
    expect(deleteItem).toHaveAttribute('data-variant', 'destructive')
  })
})

describe('DropdownMenuCheckboxItem', () => {
  it('renders with data-slot attribute', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Option A</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const item = screen.getByText('Option A').closest('[data-slot="dropdown-menu-checkbox-item"]')
    expect(item).toBeInTheDocument()
  })
})

describe('DropdownMenuRadioGroup and DropdownMenuRadioItem', () => {
  it('renders radio items with data-slot attribute', () => {
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
    const itemA = screen.getByText('Choice A').closest('[data-slot="dropdown-menu-radio-item"]')
    expect(itemA).toBeInTheDocument()
    expect(screen.getByText('Choice B')).toBeVisible()
  })
})

describe('DropdownMenuGroup', () => {
  it('renders with data-slot attribute', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Grouped Item</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Grouped Item')).toBeVisible()
  })
})

describe('DropdownMenuSub', () => {
  it('renders sub menu with trigger and content', () => {
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
    expect(screen.getByText('More')).toBeVisible()
    const subTrigger = screen.getByText('More').closest('[data-slot="dropdown-menu-sub-trigger"]')
    expect(subTrigger).toBeInTheDocument()
  })
})
