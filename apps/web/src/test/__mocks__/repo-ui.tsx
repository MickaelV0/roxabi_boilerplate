/**
 * Shared mock implementations for @repo/ui components.
 *
 * Usage in test files:
 *   vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))
 *
 * When to add a component here:
 *   - Component is used in 3+ test files
 *   - Component is presentational (no business logic)
 *   - A semantic HTML element accurately represents the component
 *
 * When to use an inline mock instead:
 *   - Component is used in only 1-2 tests
 *   - Test needs custom mock behavior (e.g., tracking calls, conditional rendering)
 */
export const Button = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>

export const Card = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
  <div {...props}>{children}</div>
)

export const CardContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const CardDescription = ({ children }: React.PropsWithChildren) => <p>{children}</p>

export const CardHeader = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const CardTitle = ({ children }: React.PropsWithChildren) => <h3>{children}</h3>

export const Input = (props: Record<string, unknown>) => <input {...props} />

export const Select = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const SelectContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const SelectItem = ({ children }: React.PropsWithChildren<{ value: string }>) => (
  <option>{children}</option>
)

export const SelectTrigger = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const SelectValue = () => <span />
