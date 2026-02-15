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
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu"]')).toBeInTheDocument()
  })

  it('should render links', () => {
    // Arrange & Act
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

    // Assert
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('should set data-viewport to true by default', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'true'
    )
  })

  it('should disable viewport when viewport is false', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'false'
    )
    expect(
      container.querySelector('[data-slot="navigation-menu-viewport"]')
    ).not.toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu className="custom-class">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu"]')).toHaveClass('custom-class')
  })
})

describe('NavigationMenuList', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu-list"]')).toBeInTheDocument()
  })
})

describe('NavigationMenuLink', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu-link"]')).toBeInTheDocument()
  })
})

describe('NavigationMenuTrigger', () => {
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
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

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu-trigger"]')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
  })
})

describe('NavigationMenuItem', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu-item"]')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className="custom-item">
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )

    // Assert
    expect(container.querySelector('[data-slot="navigation-menu-item"]')).toHaveClass('custom-item')
  })
})
