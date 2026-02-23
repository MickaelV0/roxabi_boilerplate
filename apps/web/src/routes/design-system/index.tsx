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
  SHADOW_PRESETS,
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
import { useCallback, useEffect, useState } from 'react'
import { m } from '@/paraglide/messages'

import { ComponentShowcase } from './-components/ComponentShowcase'
import { AuthForms } from './-components/compositions/AuthForms'
import { DataDisplay } from './-components/compositions/DataDisplay'
import { FeedbackPatterns } from './-components/compositions/FeedbackPatterns'
import { ThemeEditor } from './-components/ThemeEditor'

export const Route = createFileRoute('/design-system/')({
  component: DesignSystemPage,
  head: () => ({
    meta: [{ title: `${m.ds_title()} | Roxabi` }],
  }),
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'roxabi-theme'

type TabId = 'colors' | 'typography' | 'spacing' | 'components' | 'compositions'

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

/** @security The entire dangerouslySetInnerHTML template literal must not interpolate
 *  user-controlled values. STORAGE_KEY must remain a hardcoded constant and no other
 *  dynamic sources should be injected into the inline script. */
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

/** Overlay shadow CSS variables onto a derived theme (mutates in place). */
function overlayShadows(
  derived: { light: Record<string, string>; dark: Record<string, string> },
  config: ThemeConfig
) {
  const shadowVars = SHADOW_PRESETS[config.shadows]
  if (shadowVars && Object.keys(shadowVars).length > 0) {
    Object.assign(derived.light, shadowVars)
    Object.assign(derived.dark, shadowVars)
  }
}

/** Look up a base preset by name (stable — only depends on constants). */
function findBase(name: string): ShadcnPreset {
  return BASE_PRESETS.find((p) => p.name === name) ?? ZINC_PRESET
}

/** Look up a color preset by name (stable — only depends on constants). */
function findColor(name: string | null): ShadcnPreset | null {
  if (!name) return null
  return COLOR_PRESETS.find((p) => p.name === name) ?? null
}

/** Apply non-color overrides (typography, radius, shadows) onto a derived theme (mutates). */
function applyNonColorOverrides(
  derived: { light: Record<string, string>; dark: Record<string, string> },
  config: ThemeConfig
) {
  derived.light.radius = config.radius
  derived.dark.radius = config.radius
  derived.light['font-family'] = config.typography.fontFamily
  derived.dark['font-family'] = config.typography.fontFamily
  derived.light['font-size'] = config.typography.baseFontSize
  derived.dark['font-size'] = config.typography.baseFontSize
  overlayShadows(derived, config)
}

/** Persist theme data to localStorage (best-effort). */
function persistTheme(data: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable
  }
}

function useThemeFromStorage(
  setThemeConfig: (c: ThemeConfig) => void,
  setActiveBase: (b: string) => void,
  setActiveColor: (c: string | null) => void
) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const data = JSON.parse(stored) as {
        base?: string
        color?: string | null
        config: ThemeConfig
      }

      if (data.base) {
        const base = findBase(data.base)
        const color = findColor(data.color ?? null)
        const derived = getComposedDerivedTheme(base, color)
        if (data.config) applyNonColorOverrides(derived, data.config)
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
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [setThemeConfig, setActiveBase, setActiveColor])
}

function applyThemeComposition(
  baseName: string,
  colorName: string | null,
  themeConfig: ThemeConfig,
  resetAll: boolean
) {
  const base = findBase(baseName)
  const color = findColor(colorName)
  const config = getComposedConfig(base, color)

  if (resetAll) {
    config.typography = ZINC_CONFIG.typography
    config.radius = ZINC_CONFIG.radius
    config.shadows = ZINC_CONFIG.shadows
  } else {
    config.typography = themeConfig.typography
    config.radius = themeConfig.radius
    config.shadows = themeConfig.shadows
  }

  const isDefault = baseName === 'zinc' && !colorName && resetAll

  if (isDefault) {
    resetTheme()
  } else {
    const derived = getComposedDerivedTheme(base, color)
    applyNonColorOverrides(derived, config)
    applyTheme(derived)
  }

  if (isDefault) {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage unavailable
    }
  } else {
    persistTheme({ base: baseName, color: colorName, config })
  }

  return config
}

function getTabs(): { id: TabId; label: string }[] {
  return [
    { id: 'colors', label: m.ds_tab_colors() },
    { id: 'typography', label: m.ds_tab_typography() },
    { id: 'spacing', label: m.ds_tab_spacing() },
    { id: 'components', label: m.ds_tab_components() },
    { id: 'compositions', label: m.ds_tab_compositions() },
  ]
}

function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: TabId; label: string }[]
  activeTab: TabId
  onTabChange: (id: TabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label={m.ds_sections_label()}
      className="mb-8 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1"
    >
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab)
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              const next = tabs[(currentIndex + 1) % tabs.length]
              if (next) onTabChange(next.id)
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault()
              const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length]
              if (prev) onTabChange(prev.id)
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
  )
}

function TabPanels({ activeTab, config }: { activeTab: TabId; config: ThemeConfig }) {
  return (
    <>
      {activeTab === 'colors' && (
        <div role="tabpanel" id="panel-colors" aria-labelledby="tab-colors">
          <ColorsSection config={config} />
        </div>
      )}
      {activeTab === 'typography' && (
        <div role="tabpanel" id="panel-typography" aria-labelledby="tab-typography">
          <TypographySection config={config} />
        </div>
      )}
      {activeTab === 'spacing' && (
        <div role="tabpanel" id="panel-spacing" aria-labelledby="tab-spacing">
          <SpacingSection config={config} />
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
    </>
  )
}

function useDesignSystemTheme() {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(ZINC_CONFIG)
  const [activeBase, setActiveBase] = useState('zinc')
  const [activeColor, setActiveColor] = useState<string | null>(null)

  useThemeFromStorage(setThemeConfig, setActiveBase, setActiveColor)

  const applyComposed = useCallback(
    (baseName: string, colorName: string | null, resetAll = false) => {
      const config = applyThemeComposition(baseName, colorName, themeConfig, resetAll)
      setThemeConfig(config)
      setActiveBase(baseName)
      setActiveColor(colorName)
    },
    [themeConfig]
  )

  const onConfigChange = useCallback(
    (newConfig: ThemeConfig) => {
      const colorsChanged = SEED_COLOR_KEYS.some(
        (key) => newConfig.colors[key] !== themeConfig.colors[key]
      )
      setThemeConfig(newConfig)

      if (colorsChanged) {
        setActiveBase('zinc')
        setActiveColor(null)
        applyTheme(deriveFullTheme(newConfig))
        persistTheme({ config: newConfig })
      } else {
        const base = findBase(activeBase)
        const color = findColor(activeColor)
        const derived = getComposedDerivedTheme(base, color)
        applyNonColorOverrides(derived, newConfig)
        applyTheme(derived)
        persistTheme({ base: activeBase, color: activeColor, config: newConfig })
      }
    },
    [themeConfig, activeBase, activeColor]
  )

  return { themeConfig, activeBase, activeColor, applyComposed, onConfigChange }
}

function DesignSystemPage() {
  const TABS = getTabs()
  const [activeTab, setActiveTab] = useState<TabId>('colors')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = useDesignSystemTheme()

  const handleBaseSelect = useCallback(
    (preset: ShadcnPreset) => theme.applyComposed(preset.name, theme.activeColor),
    [theme.applyComposed, theme.activeColor]
  )
  const handleColorSelect = useCallback(
    (preset: ShadcnPreset | null) => theme.applyComposed(theme.activeBase, preset?.name ?? null),
    [theme.applyComposed, theme.activeBase]
  )
  const handleReset = useCallback(
    () => theme.applyComposed('zinc', null, true),
    [theme.applyComposed]
  )

  return (
    <>
      <ThemeScript />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{m.ds_title()}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{m.ds_subtitle()}</p>
        </div>
        <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabPanels activeTab={activeTab} config={theme.themeConfig} />
      </main>
      <ThemeEditor
        config={theme.themeConfig}
        onConfigChange={theme.onConfigChange}
        onBaseSelect={handleBaseSelect}
        onColorSelect={handleColorSelect}
        onReset={handleReset}
        activeBase={theme.activeBase}
        activeColor={theme.activeColor}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
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
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_colors_title()}</h2>
      <p className="mb-6 text-muted-foreground">{m.ds_colors_desc()}</p>

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
      <h3 className="mb-3 mt-10 text-xl font-semibold">{m.ds_colors_derived_title()}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{m.ds_colors_derived_desc()}</p>
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
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_typography_title()}</h2>
      <p className="mb-6 text-muted-foreground">{m.ds_typography_desc()}</p>

      {/* Current font info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">{m.ds_typography_current()}</CardTitle>
          <CardDescription>{m.ds_typography_current_desc()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">{m.ds_typography_family()}</Label>
              <p className="mt-1 font-mono text-sm">{config.typography.fontFamily}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{m.ds_typography_base_size()}</Label>
              <p className="mt-1 font-mono text-sm">{config.typography.baseFontSize}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size scale */}
      <h3 className="mb-4 text-xl font-semibold">{m.ds_typography_size_scale()}</h3>
      <div className="space-y-3">
        {FONT_SIZES.map((size) => (
          <div
            key={size.label}
            className="flex items-baseline gap-4 border-b border-border pb-3 last:border-0"
          >
            <code className="w-16 shrink-0 text-xs text-muted-foreground">{size.label}</code>
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{size.px}</code>
            <span className={size.class}>{m.ds_typography_sample()}</span>
          </div>
        ))}
      </div>

      {/* Headings */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_typography_headings()}</h3>
      <div className="space-y-4">
        {HEADING_EXAMPLES.map((heading) => (
          <div key={heading.level} className="flex items-baseline gap-4">
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{heading.level}</code>
            <span className={heading.class}>{heading.text}</span>
          </div>
        ))}
      </div>

      {/* Paragraph & prose */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_typography_body()}</h3>
      <Card>
        <CardContent className="pt-6">
          <p className="text-base leading-7">{m.ds_typography_body_primary()}</p>
          <p className="mt-4 text-sm text-muted-foreground leading-6">
            {m.ds_typography_body_secondary()}
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
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_spacing_title()}</h2>
      <p className="mb-6 text-muted-foreground">{m.ds_spacing_desc({ radius: config.radius })}</p>

      {/* Radius scale */}
      <h3 className="mb-4 text-xl font-semibold">{m.ds_spacing_radius_title()}</h3>
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
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_spacing_applied()}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{m.ds_spacing_button_radius()}</p>
            <div className="flex gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{m.ds_spacing_input_radius()}</p>
            <Input placeholder="Text input..." />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{m.ds_spacing_badge_radius()}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spacing scale reference */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_spacing_scale_title()}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{m.ds_spacing_scale_desc()}</p>
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

function InteractiveControlDemos() {
  return (
    <>
      <ComponentShowcase
        name="Button"
        category={m.ds_category_inputs()}
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
            {props.size === 'icon' ? 'A' : m.ds_demo_click_me()}
          </Button>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Input"
        category={m.ds_category_inputs()}
        propControls={[
          { name: 'placeholder', type: 'text', defaultValue: m.ds_demo_type_something() },
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

      <ComponentShowcase
        name="Textarea"
        category={m.ds_category_inputs()}
        propControls={[
          { name: 'placeholder', type: 'text', defaultValue: m.ds_demo_enter_message() },
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
    </>
  )
}

function ToggleInputDemos() {
  return (
    <>
      <ComponentShowcase
        name="Checkbox"
        category={m.ds_category_inputs()}
        propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
      >
        {(props) => (
          <div className="flex items-center gap-2">
            <Checkbox id="demo-cb" disabled={Boolean(props.disabled)} />
            <Label htmlFor="demo-cb">{m.ds_demo_accept_terms()}</Label>
          </div>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Switch"
        category={m.ds_category_inputs()}
        propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
      >
        {(props) => (
          <div className="flex items-center gap-2">
            <Switch id="demo-sw" disabled={Boolean(props.disabled)} />
            <Label htmlFor="demo-sw">{m.ds_demo_airplane_mode()}</Label>
          </div>
        )}
      </ComponentShowcase>

      <ComponentShowcase name="Select" category={m.ds_category_inputs()} propControls={[]}>
        {() => (
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={m.ds_demo_pick_fruit()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">{m.ds_demo_apple()}</SelectItem>
              <SelectItem value="banana">{m.ds_demo_banana()}</SelectItem>
              <SelectItem value="cherry">{m.ds_demo_cherry()}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Slider"
        category={m.ds_category_inputs()}
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
    </>
  )
}

function DataDisplayDemos() {
  return (
    <>
      <ComponentShowcase
        name="Badge"
        category={m.ds_category_data_display()}
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

      <ComponentShowcase name="Avatar" category={m.ds_category_data_display()} propControls={[]}>
        {() => (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt={m.ds_demo_user()} />
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
    </>
  )
}

function LayoutDemos() {
  return (
    <>
      <ComponentShowcase name="Card" category={m.ds_category_layout()} propControls={[]}>
        {() => (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>{m.ds_demo_card_title()}</CardTitle>
              <CardDescription>{m.ds_demo_card_desc()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{m.ds_demo_card_content()}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">{m.ds_demo_action()}</Button>
              <Button size="sm" variant="outline">
                {m.common_cancel()}
              </Button>
            </CardFooter>
          </Card>
        )}
      </ComponentShowcase>

      <ComponentShowcase name="Separator" category={m.ds_category_layout()} propControls={[]}>
        {() => (
          <div className="max-w-sm space-y-4">
            <div>
              <h4 className="text-sm font-medium">{m.ds_demo_section_above()}</h4>
              <p className="text-sm text-muted-foreground">{m.ds_demo_content_above()}</p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium">{m.ds_demo_section_below()}</h4>
              <p className="text-sm text-muted-foreground">{m.ds_demo_content_below()}</p>
            </div>
          </div>
        )}
      </ComponentShowcase>
    </>
  )
}

function FeedbackDemos() {
  return (
    <>
      <ComponentShowcase name="Skeleton" category={m.ds_category_feedback()} propControls={[]}>
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

      <ComponentShowcase name="Tooltip" category={m.ds_category_feedback()} propControls={[]}>
        {() => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">{m.ds_demo_hover_me()}</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{m.ds_demo_tooltip_text()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </ComponentShowcase>
    </>
  )
}

function ComponentsSection() {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_components_title()}</h2>
      <p className="mb-8 text-muted-foreground">{m.ds_components_desc()}</p>

      <div className="space-y-10">
        <InteractiveControlDemos />
        <ToggleInputDemos />
        <DataDisplayDemos />
        <LayoutDemos />
        <FeedbackDemos />
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
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_compositions_title()}</h2>
      <p className="mb-8 text-muted-foreground">{m.ds_compositions_desc()}</p>

      <div className="space-y-12">
        <div>
          <h3 className="mb-4 text-xl font-semibold">{m.ds_compositions_auth()}</h3>
          <AuthForms />
        </div>

        <Separator />

        <div>
          <h3 className="mb-4 text-xl font-semibold">{m.ds_compositions_data()}</h3>
          <DataDisplay />
        </div>

        <Separator />

        <div>
          <h3 className="mb-4 text-xl font-semibold">{m.ds_compositions_feedback()}</h3>
          <FeedbackPatterns />
        </div>
      </div>
    </section>
  )
}
