import type { ShadcnPreset, ThemeConfig } from '@repo/ui'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  applyTheme,
  BASE_PRESETS,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  COLOR_PRESETS,
  cn,
  deriveFullTheme,
  getComposedConfig,
  getComposedDerivedTheme,
  Input,
  Label,
  oklchToHex,
  resetTheme,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ComponentShowcase } from './-components/ComponentShowcase'
import { AuthForms } from './-components/compositions/AuthForms'
import { DataDisplay } from './-components/compositions/DataDisplay'
import { FeedbackPatterns } from './-components/compositions/FeedbackPatterns'
import { ThemeEditor } from './-components/ThemeEditor'

export const Route = createFileRoute('/design-system/')({
  component: DesignSystemPage,
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'roxabi-theme'

const TABS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing & Radius' },
  { id: 'components', label: 'Components' },
  { id: 'compositions', label: 'Compositions' },
] as const

type TabId = (typeof TABS)[number]['id']

const SEED_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'destructive',
  'muted',
  'background',
  'foreground',
  'border',
] as const

const FONT_SIZES = [
  { label: 'xs', class: 'text-xs', px: '12px' },
  { label: 'sm', class: 'text-sm', px: '14px' },
  { label: 'base', class: 'text-base', px: '16px' },
  { label: 'lg', class: 'text-lg', px: '18px' },
  { label: 'xl', class: 'text-xl', px: '20px' },
  { label: '2xl', class: 'text-2xl', px: '24px' },
  { label: '3xl', class: 'text-3xl', px: '30px' },
  { label: '4xl', class: 'text-4xl', px: '36px' },
]

const HEADING_EXAMPLES = [
  { level: 'h1', class: 'text-4xl font-bold tracking-tight', text: 'Heading 1' },
  { level: 'h2', class: 'text-3xl font-semibold tracking-tight', text: 'Heading 2' },
  { level: 'h3', class: 'text-2xl font-semibold', text: 'Heading 3' },
  { level: 'h4', class: 'text-xl font-semibold', text: 'Heading 4' },
  { level: 'h5', class: 'text-lg font-medium', text: 'Heading 5' },
  { level: 'h6', class: 'text-base font-medium', text: 'Heading 6' },
]

// ---------------------------------------------------------------------------
// ThemeScript: Prevents FOUC by reading localStorage and applying theme
// before React hydrates.
// ---------------------------------------------------------------------------

function ThemeScript() {
  const script = `
(function() {
  try {
    var raw = localStorage.getItem('${STORAGE_KEY}');
    if (!raw) return;
    var config = JSON.parse(raw);
    if (config && config.radius) {
      document.documentElement.style.setProperty('--radius', config.radius);
    }
    if (config && config.typography) {
      if (config.typography.fontFamily) {
        document.documentElement.style.setProperty('font-family', config.typography.fontFamily);
      }
      if (config.typography.baseFontSize) {
        document.documentElement.style.setProperty('font-size', config.typography.baseFontSize);
      }
    }
  } catch (e) {}
})();
`
  // biome-ignore lint/security/noDangerouslySetInnerHtml: FOUC prevention requires inline script before first paint
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

/** Zinc is the default base — matches theme.css */
const _zincPreset = BASE_PRESETS.find((p) => p.name === 'zinc')
if (!_zincPreset) throw new Error('Zinc preset not found in BASE_PRESETS')
const ZINC_PRESET = _zincPreset
const ZINC_CONFIG = getComposedConfig(ZINC_PRESET, null)

/** Look up a base preset by name (stable — only depends on constants). */
function findBase(name: string): ShadcnPreset {
  return BASE_PRESETS.find((p) => p.name === name) ?? ZINC_PRESET
}

/** Look up a color preset by name (stable — only depends on constants). */
function findColor(name: string | null): ShadcnPreset | null {
  if (!name) return null
  return COLOR_PRESETS.find((p) => p.name === name) ?? null
}

function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<TabId>('colors')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(ZINC_CONFIG)
  const [activeBase, setActiveBase] = useState('zinc')
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const announcementRef = useRef<HTMLOutputElement>(null)

  /** Apply the composed base + color theme and sync UI state + localStorage. */
  const applyComposed = useCallback((baseName: string, colorName: string | null) => {
    const base = findBase(baseName)
    const color = findColor(colorName)

    const isDefault = baseName === 'zinc' && !colorName
    if (isDefault) {
      resetTheme()
    } else {
      const derived = getComposedDerivedTheme(base, color)
      applyTheme(derived)
    }

    const config = getComposedConfig(base, color)
    setThemeConfig(config)
    setActiveBase(baseName)
    setActiveColor(colorName)

    try {
      if (isDefault) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ base: baseName, color: colorName, config })
        )
      }
    } catch {
      // localStorage unavailable
    }
  }, [])

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const data = JSON.parse(stored) as {
        base?: string
        color?: string | null
        config: ThemeConfig
      }

      // Restore base + color composition
      if (data.base) {
        const base = findBase(data.base)
        const color = findColor(data.color ?? null)
        const derived = getComposedDerivedTheme(base, color)
        applyTheme(derived)
        setThemeConfig(data.config)
        setActiveBase(data.base)
        setActiveColor(data.color ?? null)
        return
      }

      // Legacy: manual config without base/color
      setThemeConfig(data.config)
      setActiveBase('zinc')
      setActiveColor(null)
      const derived = deriveFullTheme(data.config)
      applyTheme(derived)
    } catch {
      // localStorage unavailable or corrupt — use defaults
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Handle manual config changes from color pickers / sliders
  const handleConfigChange = useCallback((newConfig: ThemeConfig) => {
    setThemeConfig(newConfig)
    setActiveBase('zinc')
    setActiveColor(null)

    const derived = deriveFullTheme(newConfig)
    applyTheme(derived)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config: newConfig }))
    } catch {
      // localStorage unavailable
    }
  }, [])

  // Handle base preset selection (keeps current color overlay)
  const handleBaseSelect = useCallback(
    (preset: ShadcnPreset) => {
      applyComposed(preset.name, activeColor)
    },
    [applyComposed, activeColor]
  )

  // Handle color preset selection (keeps current base)
  const handleColorSelect = useCallback(
    (preset: ShadcnPreset | null) => {
      applyComposed(activeBase, preset?.name ?? null)
    },
    [applyComposed, activeBase]
  )

  // Reset to Zinc base with no color overlay
  const handleReset = useCallback(() => {
    applyComposed('zinc', null)
  }, [applyComposed])

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev)
  }

  return (
    <>
      <ThemeScript />

      <main
        className={cn(
          'mx-auto max-w-7xl px-6 py-16 transition-[margin] duration-200',
          sidebarOpen && 'lg:mr-80'
        )}
      >
        {/* Page header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Interactive component playground &amp; theme customization.
          </p>
        </div>

        {/* Tab navigation */}
        <div
          role="tablist"
          aria-label="Design system sections"
          className="mb-8 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1"
        >
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                const currentIndex = TABS.findIndex((t) => t.id === activeTab)
                if (e.key === 'ArrowRight') {
                  e.preventDefault()
                  const next = TABS[(currentIndex + 1) % TABS.length]
                  if (next) setActiveTab(next.id)
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const prev = TABS[(currentIndex - 1 + TABS.length) % TABS.length]
                  if (prev) setActiveTab(prev.id)
                }
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels — conditional rendering (only active tab is mounted) */}
        {activeTab === 'colors' && (
          <div role="tabpanel" id="panel-colors" aria-labelledby="tab-colors">
            <ColorsSection config={themeConfig} />
          </div>
        )}
        {activeTab === 'typography' && (
          <div role="tabpanel" id="panel-typography" aria-labelledby="tab-typography">
            <TypographySection config={themeConfig} />
          </div>
        )}
        {activeTab === 'spacing' && (
          <div role="tabpanel" id="panel-spacing" aria-labelledby="tab-spacing">
            <SpacingSection config={themeConfig} />
          </div>
        )}
        {activeTab === 'components' && (
          <div role="tabpanel" id="panel-components" aria-labelledby="tab-components">
            <ComponentsSection />
          </div>
        )}
        {activeTab === 'compositions' && (
          <div role="tabpanel" id="panel-compositions" aria-labelledby="tab-compositions">
            <CompositionsSection />
          </div>
        )}

        {/* Announcements for screen readers */}
        <output ref={announcementRef} aria-live="polite" className="sr-only" />
      </main>

      {/* Theme Editor sidebar */}
      <ThemeEditor
        config={themeConfig}
        onConfigChange={handleConfigChange}
        onBaseSelect={handleBaseSelect}
        onColorSelect={handleColorSelect}
        onReset={handleReset}
        activeBase={activeBase}
        activeColor={activeColor}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab Section: Colors
// ---------------------------------------------------------------------------

function ColorsSection({ config }: { config: ThemeConfig }) {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">Seed Colors</h2>
      <p className="mb-6 text-muted-foreground">
        The 8 semantic color tokens that seed the entire theme. Each value is in OKLch color space.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SEED_COLOR_KEYS.map((key) => {
          const oklchValue = config.colors[key]
          let hexValue: string
          try {
            hexValue = oklchToHex(oklchValue)
          } catch {
            hexValue = '#000000'
          }

          return (
            <Card key={key}>
              <div className="h-20 rounded-t-lg" style={{ backgroundColor: hexValue }} />
              <CardContent className="pt-3">
                <p className="text-sm font-medium capitalize">{key}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{hexValue}</p>
                <p
                  className="mt-0.5 font-mono text-xs text-muted-foreground truncate"
                  title={oklchValue}
                >
                  {oklchValue}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Derived variable preview */}
      <h3 className="mb-3 mt-10 text-xl font-semibold">Derived Variables</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        These CSS custom properties are derived from the seed colors above and applied as Tailwind
        utility classes.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'bg-primary', className: 'bg-primary' },
          { name: 'bg-secondary', className: 'bg-secondary' },
          { name: 'bg-accent', className: 'bg-accent' },
          { name: 'bg-destructive', className: 'bg-destructive' },
          { name: 'bg-muted', className: 'bg-muted' },
          { name: 'bg-background', className: 'bg-background border border-border' },
          { name: 'text-foreground', className: 'bg-background border border-border' },
          { name: 'border-border', className: 'bg-background border-2 border-border' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className={cn('size-10 shrink-0 rounded-md', item.className)} />
            <code className="text-xs text-muted-foreground">{item.name}</code>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tab Section: Typography
// ---------------------------------------------------------------------------

function TypographySection({ config }: { config: ThemeConfig }) {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">Typography</h2>
      <p className="mb-6 text-muted-foreground">Font family, size scale, and heading hierarchy.</p>

      {/* Current font info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Current Font</CardTitle>
          <CardDescription>
            Active typography settings from the theme configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Font Family</Label>
              <p className="mt-1 font-mono text-sm">{config.typography.fontFamily}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Base Font Size</Label>
              <p className="mt-1 font-mono text-sm">{config.typography.baseFontSize}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size scale */}
      <h3 className="mb-4 text-xl font-semibold">Size Scale</h3>
      <div className="space-y-3">
        {FONT_SIZES.map((size) => (
          <div
            key={size.label}
            className="flex items-baseline gap-4 border-b border-border pb-3 last:border-0"
          >
            <code className="w-16 shrink-0 text-xs text-muted-foreground">{size.label}</code>
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{size.px}</code>
            <span className={size.class}>The quick brown fox jumps over the lazy dog.</span>
          </div>
        ))}
      </div>

      {/* Headings */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">Heading Hierarchy</h3>
      <div className="space-y-4">
        {HEADING_EXAMPLES.map((heading) => (
          <div key={heading.level} className="flex items-baseline gap-4">
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{heading.level}</code>
            <span className={heading.class}>{heading.text}</span>
          </div>
        ))}
      </div>

      {/* Paragraph & prose */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">Body Text</h3>
      <Card>
        <CardContent className="pt-6">
          <p className="text-base leading-7">
            This is a paragraph of body text demonstrating the default reading experience. Good
            typography creates a visual hierarchy that guides users through content. The line
            height, letter spacing, and font weight all contribute to readability.
          </p>
          <p className="mt-4 text-sm text-muted-foreground leading-6">
            This is a secondary paragraph using muted foreground for supplementary information. It
            uses a smaller font size and reduced visual weight compared to the primary text above.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tab Section: Spacing & Radius
// ---------------------------------------------------------------------------

function SpacingSection({ config }: { config: ThemeConfig }) {
  const radiusSizes = [
    { label: 'sm', calc: `calc(${config.radius} - 4px)` },
    { label: 'md', calc: `calc(${config.radius} - 2px)` },
    { label: 'lg', calc: config.radius },
    { label: 'xl', calc: `calc(${config.radius} + 4px)` },
  ]

  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">Spacing &amp; Radius</h2>
      <p className="mb-6 text-muted-foreground">
        Border radius scale derived from the base radius value. Current base:{' '}
        <code className="font-mono">{config.radius}</code>.
      </p>

      {/* Radius scale */}
      <h3 className="mb-4 text-xl font-semibold">Border Radius Scale</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {radiusSizes.map((size) => (
          <Card key={size.label}>
            <CardContent className="flex flex-col items-center gap-3 pt-6">
              <div
                className="size-20 border-2 border-primary bg-primary/10"
                style={{ borderRadius: size.calc }}
              />
              <div className="text-center">
                <p className="text-sm font-medium">radius-{size.label}</p>
                <code className="text-xs text-muted-foreground">{size.calc}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applied examples */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">Applied Examples</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Button Radius</p>
            <div className="flex gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Input Radius</p>
            <Input placeholder="Text input..." />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Badge Radius</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spacing scale reference */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">Spacing Scale</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Tailwind spacing utilities used throughout the design system.
      </p>
      <div className="space-y-2">
        {[
          { label: '1', px: '4px' },
          { label: '2', px: '8px' },
          { label: '3', px: '12px' },
          { label: '4', px: '16px' },
          { label: '6', px: '24px' },
          { label: '8', px: '32px' },
          { label: '12', px: '48px' },
          { label: '16', px: '64px' },
        ].map((space) => (
          <div key={space.label} className="flex items-center gap-4">
            <code className="w-10 shrink-0 text-right text-xs text-muted-foreground">
              {space.label}
            </code>
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{space.px}</code>
            <div className="h-4 rounded-sm bg-primary/70" style={{ width: space.px }} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tab Section: Components
// ---------------------------------------------------------------------------

function ComponentsSection() {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">Components</h2>
      <p className="mb-8 text-muted-foreground">
        Interactive previews of @repo/ui components. Adjust props using the controls below each
        component.
      </p>

      <div className="space-y-10">
        {/* Button */}
        <ComponentShowcase
          name="Button"
          category="Inputs"
          propControls={[
            {
              name: 'variant',
              type: 'select',
              options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
              defaultValue: 'default',
            },
            {
              name: 'size',
              type: 'select',
              options: ['default', 'sm', 'lg', 'icon'],
              defaultValue: 'default',
            },
            { name: 'disabled', type: 'boolean', defaultValue: false },
          ]}
        >
          {(props) => (
            // TODO(#90): type preview props properly — ComponentShowcase children receive Record<string, unknown>
            <Button
              variant={props.variant as 'default'}
              size={props.size as 'default'}
              disabled={Boolean(props.disabled)}
            >
              {props.size === 'icon' ? 'A' : 'Click me'}
            </Button>
          )}
        </ComponentShowcase>

        {/* Badge */}
        <ComponentShowcase
          name="Badge"
          category="Data Display"
          propControls={[
            {
              name: 'variant',
              type: 'select',
              options: ['default', 'secondary', 'destructive', 'outline'],
              defaultValue: 'default',
            },
            { name: 'text', type: 'text', defaultValue: 'Badge' },
          ]}
        >
          {/* TODO(#90): type preview props properly — ComponentShowcase children receive Record<string, unknown> */}
          {(props) => <Badge variant={props.variant as 'default'}>{String(props.text)}</Badge>}
        </ComponentShowcase>

        {/* Input */}
        <ComponentShowcase
          name="Input"
          category="Inputs"
          propControls={[
            { name: 'placeholder', type: 'text', defaultValue: 'Type something...' },
            { name: 'disabled', type: 'boolean', defaultValue: false },
          ]}
        >
          {(props) => (
            <Input
              placeholder={String(props.placeholder)}
              disabled={Boolean(props.disabled)}
              className="max-w-sm"
            />
          )}
        </ComponentShowcase>

        {/* Textarea */}
        <ComponentShowcase
          name="Textarea"
          category="Inputs"
          propControls={[
            { name: 'placeholder', type: 'text', defaultValue: 'Enter a message...' },
            { name: 'disabled', type: 'boolean', defaultValue: false },
          ]}
        >
          {(props) => (
            <Textarea
              placeholder={String(props.placeholder)}
              disabled={Boolean(props.disabled)}
              className="max-w-sm"
            />
          )}
        </ComponentShowcase>

        {/* Checkbox */}
        <ComponentShowcase
          name="Checkbox"
          category="Inputs"
          propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
        >
          {(props) => (
            <div className="flex items-center gap-2">
              <Checkbox id="demo-cb" disabled={Boolean(props.disabled)} />
              <Label htmlFor="demo-cb">Accept terms and conditions</Label>
            </div>
          )}
        </ComponentShowcase>

        {/* Switch */}
        <ComponentShowcase
          name="Switch"
          category="Inputs"
          propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
        >
          {(props) => (
            <div className="flex items-center gap-2">
              <Switch id="demo-sw" disabled={Boolean(props.disabled)} />
              <Label htmlFor="demo-sw">Airplane Mode</Label>
            </div>
          )}
        </ComponentShowcase>

        {/* Select */}
        <ComponentShowcase name="Select" category="Inputs" propControls={[]}>
          {() => (
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pick a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
          )}
        </ComponentShowcase>

        {/* Slider */}
        <ComponentShowcase
          name="Slider"
          category="Inputs"
          propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
        >
          {(props) => (
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              disabled={Boolean(props.disabled)}
              className="max-w-sm"
            />
          )}
        </ComponentShowcase>

        {/* Card */}
        <ComponentShowcase name="Card" category="Layout" propControls={[]}>
          {() => (
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description with supporting text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card content goes here.</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Action</Button>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )}
        </ComponentShowcase>

        {/* Avatar */}
        <ComponentShowcase name="Avatar" category="Data Display" propControls={[]}>
          {() => (
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </div>
          )}
        </ComponentShowcase>

        {/* Separator */}
        <ComponentShowcase name="Separator" category="Layout" propControls={[]}>
          {() => (
            <div className="max-w-sm space-y-4">
              <div>
                <h4 className="text-sm font-medium">Section Above</h4>
                <p className="text-sm text-muted-foreground">Content above the separator.</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium">Section Below</h4>
                <p className="text-sm text-muted-foreground">Content below the separator.</p>
              </div>
            </div>
          )}
        </ComponentShowcase>

        {/* Skeleton */}
        <ComponentShowcase name="Skeleton" category="Feedback" propControls={[]}>
          {() => (
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          )}
        </ComponentShowcase>

        {/* Tooltip */}
        <ComponentShowcase name="Tooltip" category="Feedback" propControls={[]}>
          {() => (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </ComponentShowcase>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tab Section: Compositions
// ---------------------------------------------------------------------------

function CompositionsSection() {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">Compositions</h2>
      <p className="mb-8 text-muted-foreground">
        Real-world UI patterns assembled from @repo/ui components. Copy these patterns as starting
        points for your features.
      </p>

      <div className="space-y-12">
        <div>
          <h3 className="mb-4 text-xl font-semibold">Authentication Forms</h3>
          <AuthForms />
        </div>

        <Separator />

        <div>
          <h3 className="mb-4 text-xl font-semibold">Data Display</h3>
          <DataDisplay />
        </div>

        <Separator />

        <div>
          <h3 className="mb-4 text-xl font-semibold">Feedback Patterns</h3>
          <FeedbackPatterns />
        </div>
      </div>
    </section>
  )
}
