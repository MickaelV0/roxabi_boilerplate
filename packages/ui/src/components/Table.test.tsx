import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './Table'

describe('Table', () => {
  it('renders children correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Cell content')).toBeInTheDocument()
  })

  it('has data-slot attributes', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(container.querySelector('[data-slot="table-wrapper"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="table"]')).toBeInTheDocument()
  })

  it('applies custom className to the table element', () => {
    const { container } = render(
      <Table className="custom-class">
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(container.querySelector('[data-slot="table"]')).toHaveClass('custom-class')
  })
})

describe('TableHeader', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </table>
    )
    expect(container.querySelector('[data-slot="table-header"]')).toBeInTheDocument()
  })
})

describe('TableBody', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <table>
        <TableBody>
          <TableRow>
            <TableCell>Body</TableCell>
          </TableRow>
        </TableBody>
      </table>
    )
    expect(container.querySelector('[data-slot="table-body"]')).toBeInTheDocument()
  })
})

describe('TableFooter', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <table>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </table>
    )
    expect(container.querySelector('[data-slot="table-footer"]')).toBeInTheDocument()
  })
})

describe('TableRow', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <table>
        <TableBody>
          <TableRow>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </table>
    )
    expect(container.querySelector('[data-slot="table-row"]')).toBeInTheDocument()
  })
})

describe('TableHead', () => {
  it('renders header text', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead>Column Name</TableHead>
          </tr>
        </thead>
      </table>
    )
    expect(screen.getByText('Column Name')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead>Header</TableHead>
          </tr>
        </thead>
      </table>
    )
    expect(container.querySelector('[data-slot="table-head"]')).toBeInTheDocument()
  })
})

describe('TableCell', () => {
  it('renders cell content', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell>Cell data</TableCell>
          </tr>
        </tbody>
      </table>
    )
    expect(screen.getByText('Cell data')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>Cell</TableCell>
          </tr>
        </tbody>
      </table>
    )
    expect(container.querySelector('[data-slot="table-cell"]')).toBeInTheDocument()
  })
})

describe('TableCaption', () => {
  it('renders caption text', () => {
    render(
      <table>
        <TableCaption>A list of items</TableCaption>
      </table>
    )
    expect(screen.getByText('A list of items')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(
      <table>
        <TableCaption>Caption</TableCaption>
      </table>
    )
    expect(container.querySelector('[data-slot="table-caption"]')).toBeInTheDocument()
  })
})

describe('Table composed', () => {
  it('renders a full table with all subcomponents', () => {
    const { container } = render(
      <Table>
        <TableCaption>Invoice list</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>INV-001</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>$250.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell>$250.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
    expect(container.querySelector('[data-slot="table"]')).toBeInTheDocument()
    expect(screen.getByText('Invoice list')).toBeInTheDocument()
    expect(screen.getByText('Invoice')).toBeInTheDocument()
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })
})
