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

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Simplified mock: filter + join. Diverges from the real cn() which uses
 * clsx + tailwind-merge (class deduplication & conflict resolution).
 * Do NOT rely on this mock for class-assertion tests.
 */
export const cn = (...args: unknown[]) => args.filter(Boolean).join(' ')

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const AnimatedSection = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => <div className={className}>{children}</div>

// ---------------------------------------------------------------------------
// Layout / Card
// ---------------------------------------------------------------------------

export const Card = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
  <div {...props}>{children}</div>
)

export const CardContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const CardDescription = ({ children }: React.PropsWithChildren) => <p>{children}</p>

export const CardFooter = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const CardHeader = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const CardTitle = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <h3 {...props}>{children}</h3>

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const Button = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>

export const Checkbox = ({
  id,
  checked,
  ...props
}: {
  id?: string
  checked?: boolean
  onCheckedChange?: (v: boolean) => void
}) => <input type="checkbox" id={id} checked={checked} onChange={() => {}} {...props} />

export const Input = (props: Record<string, unknown>) => <input {...props} />

export const Label = ({
  children,
  htmlFor,
  ...props
}: React.PropsWithChildren<{ htmlFor?: string; [key: string]: unknown }>) => (
  <label htmlFor={htmlFor} {...props}>
    {children}
  </label>
)

export const OAuthButton = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>

export const PasswordInput = (props: Record<string, unknown>) => (
  <input type="password" {...props} />
)

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export const Badge = ({
  children,
  variant,
  ...props
}: React.PropsWithChildren<{ variant?: string }>) => (
  <span data-variant={variant} {...props}>
    {children}
  </span>
)

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const FormMessage = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => (
  <div role="alert" aria-live="polite" {...props}>
    {children}
  </div>
)

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export const Tabs = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
  <div data-testid="tabs" {...props}>
    {children}
  </div>
)

export const TabsList = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => (
  <div role="tablist" {...props}>
    {children}
  </div>
)

export const TabsTrigger = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => (
  <button role="tab" {...props}>
    {children}
  </button>
)

export const TabsContent = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => (
  <div role="tabpanel" {...props}>
    {children}
  </div>
)

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export const Select = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const SelectContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const SelectItem = ({ children }: React.PropsWithChildren<{ value: string }>) => (
  <option>{children}</option>
)

export const SelectTrigger = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const SelectValue = () => <span />

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

export const Dialog = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DialogClose = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DialogContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DialogDescription = ({ children }: React.PropsWithChildren) => <p>{children}</p>

export const DialogFooter = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DialogHeader = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DialogTitle = ({ children }: React.PropsWithChildren) => <h2>{children}</h2>

export const DialogTrigger = ({ children }: React.PropsWithChildren) => <div>{children}</div>

// ---------------------------------------------------------------------------
// AlertDialog
// ---------------------------------------------------------------------------

export const AlertDialog = ({
  children,
  open,
}: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>) =>
  open ? <div data-testid="alert-dialog">{children}</div> : null

export const AlertDialogAction = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>

export const AlertDialogCancel = ({ children }: React.PropsWithChildren) => (
  <button type="button">{children}</button>
)

export const AlertDialogContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const AlertDialogDescription = ({ children }: React.PropsWithChildren) => <p>{children}</p>

export const AlertDialogFooter = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const AlertDialogHeader = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const AlertDialogTitle = ({ children }: React.PropsWithChildren) => <h2>{children}</h2>

// ---------------------------------------------------------------------------
// DropdownMenu
// ---------------------------------------------------------------------------

export const DropdownMenu = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DropdownMenuTrigger = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>

export const DropdownMenuContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>

export const DropdownMenuItem = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => (
  <button type="button" role="menuitem" {...props}>
    {children}
  </button>
)

export const DropdownMenuSeparator = () => <hr />

export const DropdownMenuLabel = ({ children }: React.PropsWithChildren) => <div>{children}</div>

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useInView = () => ({ ref: { current: null }, inView: true })

export const useReducedMotion = () => false

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

export const PresentationNav = ({
  sections,
}: {
  sections?: ReadonlyArray<{ id: string; label: string }>
  onEscape?: () => void
}) => (
  <nav data-testid="presentation-nav">
    {sections?.map((s) => (
      <button key={s.id} type="button">
        {s.label}
      </button>
    ))}
  </nav>
)

export const StatCounter = ({
  value,
  label,
}: {
  value?: number
  label?: string
  suffix?: string
  delay?: number
}) => (
  <div data-testid="stat-counter">
    <span>{value}</span>
    <span>{label}</span>
  </div>
)

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const Table = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
  <table {...props}>{children}</table>
)

export const TableHeader = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <thead {...props}>{children}</thead>

export const TableBody = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <tbody {...props}>{children}</tbody>

export const TableRow = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <tr {...props}>{children}</tr>

export const TableHead = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <th {...props}>{children}</th>

export const TableCell = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) => <td {...props}>{children}</td>
