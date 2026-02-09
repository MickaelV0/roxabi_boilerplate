import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './NavigationMenu'

describe('NavigationMenu', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu"]')).toBeInTheDocument()
  })

  it('renders links', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/about">About</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('sets data-viewport to true by default', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'true'
    )
  })

  it('can disable viewport', () => {
    const { container } = render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'false'
    )
    expect(
      container.querySelector('[data-slot="navigation-menu-viewport"]')
    ).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <NavigationMenu className="custom-class">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu"]')).toHaveClass('custom-class')
  })
})

describe('NavigationMenuList', () => {
  it('has data-slot attribute', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu-list"]')).toBeInTheDocument()
  })
})

describe('NavigationMenuLink', () => {
  it('has data-slot attribute', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu-link"]')).toBeInTheDocument()
  })
})

describe('NavigationMenuTrigger', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/product-a">Product A</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu-trigger"]')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
  })
})

describe('NavigationMenuItem', () => {
  it('has data-slot attribute', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu-item"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className="custom-item">
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(container.querySelector('[data-slot="navigation-menu-item"]')).toHaveClass('custom-item')
  })
})
