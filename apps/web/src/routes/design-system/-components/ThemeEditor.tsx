import type { ShadcnPreset, ThemeConfig, ThemeShadows } from '@repo/ui'
import {
  BASE_PRESETS,
  Button,
  COLOR_PRESETS,
  cn,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
} from '@repo/ui'
import { PaletteIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { m } from '@/paraglide/messages'

import { ColorPicker } from './ColorPicker'

type ThemeEditorProps = {
  config: ThemeConfig
  onConfigChange: (config: ThemeConfig) => void
  onBaseSelect: (preset: ShadcnPreset) => void
  onColorSelect: (preset: ShadcnPreset | null) => void
  onReset: () => void
  activeBase: string
  activeColor: string | null
  isOpen: boolean
  onToggle: () => void
}

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

function getSeedColorLabels(): Record<(typeof SEED_COLOR_KEYS)[number], string> {
  return {
    primary: m.ds_color_primary(),
    secondary: m.ds_color_secondary(),
    accent: m.ds_color_accent(),
    destructive: m.ds_color_destructive(),
    muted: m.ds_color_muted(),
    background: m.ds_color_background(),
    foreground: m.ds_color_foreground(),
    border: m.ds_color_border(),
  }
}

/** Pairs to check for WCAG AA contrast (foreground against background). */
const CONTRAST_PAIRS: Array<{
  color: (typeof SEED_COLOR_KEYS)[number]
  against: (typeof SEED_COLOR_KEYS)[number]
}> = [
  { color: 'foreground', against: 'background' },
  { color: 'primary', against: 'background' },
  { color: 'destructive', against: 'background' },
  { color: 'accent', against: 'background' },
]

const DEFAULT_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"

const FONT_FAMILIES = [
  { value: DEFAULT_FONT_FAMILY, label: 'System Default' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'ui-monospace, monospace', label: 'Monospace' },
]

const SHADOW_OPTIONS: ThemeShadows[] = ['none', 'subtle', 'medium', 'strong']

/** Parse numeric value from string like "16px" or "0.625rem" */
function parseNumeric(value: string): number {
  return Number.parseFloat(value) || 0
}

/** Get the contrastAgainst value for a given color key */
function getContrastAgainst(
  key: (typeof SEED_COLOR_KEYS)[number],
  config: ThemeConfig
): string | undefined {
  const pair = CONTRAST_PAIRS.find((p) => p.color === key)
  return pair ? config.colors[pair.against] : undefined
}

function BasePresetsSection({
  activeBase,
  onBaseClick,
}: {
  activeBase: string
  onBaseClick: (preset: ShadcnPreset) => void
}) {
  return (
    <section aria-labelledby="base-presets-heading">
      <h3
        id="base-presets-heading"
        className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {m.ds_theme_base()}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {BASE_PRESETS.map((preset) => (
          <Button
            key={preset.name}
            variant={activeBase === preset.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => onBaseClick(preset)}
          >
            {preset.title}
          </Button>
        ))}
      </div>
    </section>
  )
}

function ColorPresetsSection({
  activeColor,
  onColorClick,
}: {
  activeColor: string | null
  onColorClick: (preset: ShadcnPreset) => void
}) {
  return (
    <section aria-labelledby="color-presets-heading" className="mt-4">
      <h3
        id="color-presets-heading"
        className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {m.ds_theme_accent_color()}
      </h3>
      <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
        {COLOR_PRESETS.map((preset) => (
          <Button
            key={preset.name}
            variant={activeColor === preset.name ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onColorClick(preset)}
          >
            {preset.title}
          </Button>
        ))}
      </div>
    </section>
  )
}

function SeedColorsSection({
  config,
  onColorChange,
}: {
  config: ThemeConfig
  onColorChange: (key: (typeof SEED_COLOR_KEYS)[number], value: string) => void
}) {
  return (
    <section aria-labelledby="colors-heading">
      <h3
        id="colors-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {m.ds_theme_seed_colors()}
      </h3>
      <div className="space-y-3">
        {SEED_COLOR_KEYS.map((key) => (
          <ColorPicker
            key={key}
            label={getSeedColorLabels()[key]}
            value={config.colors[key]}
            onChange={(v) => onColorChange(key, v)}
            contrastAgainst={getContrastAgainst(key, config)}
          />
        ))}
      </div>
    </section>
  )
}

function ThemeFontControls({
  config,
  onFontFamilyChange,
  onFontSizeChange,
}: {
  config: ThemeConfig
  onFontFamilyChange: (value: string) => void
  onFontSizeChange: (values: number[]) => void
}) {
  const currentFontSize = parseNumeric(config.typography.baseFontSize)

  return (
    <section aria-labelledby="typography-heading">
      <h3
        id="typography-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {m.ds_theme_typography()}
      </h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="font-family" className="text-xs">
            {m.ds_theme_font_family()}
          </Label>
          <Select value={config.typography.fontFamily} onValueChange={onFontFamilyChange}>
            <SelectTrigger id="font-family" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size" className="text-xs">
              {m.ds_theme_base_font_size()}
            </Label>
            <span className="text-xs text-muted-foreground">{currentFontSize}px</span>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={24}
            step={1}
            value={[currentFontSize]}
            onValueChange={onFontSizeChange}
            aria-label={m.ds_theme_base_font_size_aria()}
          />
        </div>
      </div>
    </section>
  )
}

function RadiusSection({
  config,
  onRadiusChange,
}: {
  config: ThemeConfig
  onRadiusChange: (values: number[]) => void
}) {
  const currentRadius = parseNumeric(config.radius)

  return (
    <section aria-labelledby="radius-heading">
      <h3
        id="radius-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {m.ds_theme_border_radius()}
      </h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="radius-slider" className="text-xs">
            {m.ds_theme_radius()}
          </Label>
          <span className="text-xs text-muted-foreground">{currentRadius}rem</span>
        </div>
        <Slider
          id="radius-slider"
          min={0}
          max={1.5}
          step={0.125}
          value={[currentRadius]}
          onValueChange={onRadiusChange}
          aria-label={m.ds_theme_border_radius_aria()}
        />
        <div className="mt-2 flex gap-2">
          {['sm', 'md', 'lg', 'xl'].map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <div
                className="size-8 border border-border bg-muted"
                style={{
                  borderRadius:
                    size === 'sm'
                      ? `calc(${config.radius} - 4px)`
                      : size === 'md'
                        ? `calc(${config.radius} - 2px)`
                        : size === 'lg'
                          ? config.radius
                          : `calc(${config.radius} + 4px)`,
                }}
              />
              <span className="text-[10px] text-muted-foreground">{size}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ShadowsSection({
  config,
  onShadowChange,
}: {
  config: ThemeConfig
  onShadowChange: (shadow: ThemeShadows) => void
}) {
  const shadowLabels: Record<string, () => string> = {
    none: m.ds_shadow_none,
    subtle: m.ds_shadow_subtle,
    medium: m.ds_shadow_medium,
    strong: m.ds_shadow_strong,
  }

  return (
    <section aria-labelledby="shadows-heading">
      <h3
        id="shadows-heading"
        className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {m.ds_theme_shadows()}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {SHADOW_OPTIONS.map((shadow) => (
          <Button
            key={shadow}
            variant={config.shadows === shadow ? 'default' : 'outline'}
            size="sm"
            onClick={() => onShadowChange(shadow)}
          >
            {shadowLabels[shadow]?.() ?? shadow}
          </Button>
        ))}
      </div>
    </section>
  )
}

/**
 * Theme editor sidebar panel.
 *
 * Presets are split into two independent groups:
 * - **Base** (Neutral, Stone, Zinc, Gray): controls background/foreground/border tones
 * - **Color** (17 accent colors): controls primary, charts, sidebar accent
 *
 * Selecting a base keeps the current color overlay. Selecting a color keeps the
 * current base. Clicking an active color deselects it (returns to base-only).
 */

type ThemeEditorSidebarRefs = {
  sidebarRef: React.RefObject<HTMLElement | null>
  announcementRef: React.RefObject<HTMLOutputElement | null>
}

type ThemeEditorSidebarHandlers = {
  onConfigChange: (config: ThemeConfig) => void
  onBaseClick: (preset: ShadcnPreset) => void
  onColorClick: (preset: ShadcnPreset) => void
  onColorChange: (key: (typeof SEED_COLOR_KEYS)[number], v: string) => void
  onFontFamilyChange: (v: string) => void
  onFontSizeChange: (v: number[]) => void
  onRadiusChange: (v: number[]) => void
  onReset: () => void
  onToggle: () => void
}

type ThemeEditorSidebarProps = {
  config: ThemeConfig
  activeBase: string
  activeColor: string | null
  isOpen: boolean
  refs: ThemeEditorSidebarRefs
  handlers: ThemeEditorSidebarHandlers
}

function ThemeEditorSidebar({
  config,
  activeBase,
  activeColor,
  isOpen,
  refs,
  handlers,
}: ThemeEditorSidebarProps) {
  const {
    onConfigChange,
    onBaseClick,
    onColorClick,
    onColorChange,
    onFontFamilyChange,
    onFontSizeChange,
    onRadiusChange,
    onReset,
    onToggle,
  } = handlers
  return (
    <aside
      ref={refs.sidebarRef}
      aria-label={m.ds_theme_editor_aria()}
      tabIndex={-1}
      className={cn(
        'fixed top-0 right-0 z-[60] h-full w-80 border-l border-border bg-background shadow-lg transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <PaletteIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{m.ds_theme_editor()}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} aria-label={m.ds_theme_close_aria()}>
            <XIcon className="size-4" />
            {m.ds_theme_close()}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <BasePresetsSection activeBase={activeBase} onBaseClick={onBaseClick} />
          <ColorPresetsSection activeColor={activeColor} onColorClick={onColorClick} />
          <Separator className="my-4" />
          <SeedColorsSection config={config} onColorChange={onColorChange} />
          <Separator className="my-4" />
          <ThemeFontControls
            config={config}
            onFontFamilyChange={onFontFamilyChange}
            onFontSizeChange={onFontSizeChange}
          />
          <Separator className="my-4" />
          <RadiusSection config={config} onRadiusChange={onRadiusChange} />
          <Separator className="my-4" />
          <ShadowsSection
            config={config}
            onShadowChange={(shadow) => onConfigChange({ ...config, shadows: shadow })}
          />
          <Separator className="my-4" />
          <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
            <RotateCcwIcon className="size-3.5" />
            {m.ds_theme_reset()}
          </Button>
        </div>

        <output ref={refs.announcementRef} aria-live="polite" className="sr-only" />
      </div>
    </aside>
  )
}

function useThemeEditorBehavior(isOpen: boolean, onToggle: () => void) {
  const sidebarRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const announcementRef = useRef<HTMLOutputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => sidebarRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
    triggerRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onToggle()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onToggle])

  const announce = useCallback((message: string) => {
    if (announcementRef.current) announcementRef.current.textContent = message
  }, [])

  return { sidebarRef, triggerRef, announcementRef, announce }
}

function ThemeEditorTrigger({
  triggerRef,
  isOpen,
  onToggle,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn('fixed right-4 top-20 z-40', isOpen && 'hidden')}
        aria-label={m.ds_theme_open_aria()}
        aria-expanded={isOpen}
      >
        <PaletteIcon className="size-4" />
        <span className="hidden sm:inline">{m.ds_theme_toggle()}</span>
      </Button>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
          aria-label={m.ds_theme_close_aria()}
        />
      )}
    </>
  )
}

export function ThemeEditor({
  config,
  onConfigChange,
  onBaseSelect,
  onColorSelect,
  onReset,
  activeBase,
  activeColor,
  isOpen,
  onToggle,
}: ThemeEditorProps) {
  const { sidebarRef, triggerRef, announcementRef, announce } = useThemeEditorBehavior(
    isOpen,
    onToggle
  )

  function handleColorChange(key: (typeof SEED_COLOR_KEYS)[number], oklchValue: string) {
    onConfigChange({ ...config, colors: { ...config.colors, [key]: oklchValue } })
  }

  function handleBaseClick(preset: ShadcnPreset) {
    onBaseSelect(preset)
    announce(m.ds_theme_announce_base({ title: preset.title }))
  }

  function handleColorClick(preset: ShadcnPreset) {
    if (activeColor === preset.name) {
      onColorSelect(null)
      announce(m.ds_theme_announce_color_removed({ title: preset.title }))
    } else {
      onColorSelect(preset)
      announce(m.ds_theme_announce_color_applied({ title: preset.title }))
    }
  }

  return (
    <>
      <ThemeEditorTrigger triggerRef={triggerRef} isOpen={isOpen} onToggle={onToggle} />
      <ThemeEditorSidebar
        config={config}
        activeBase={activeBase}
        activeColor={activeColor}
        isOpen={isOpen}
        refs={{ sidebarRef, announcementRef }}
        handlers={{
          onConfigChange,
          onBaseClick: handleBaseClick,
          onColorClick: handleColorClick,
          onColorChange: handleColorChange,
          onFontFamilyChange: (v) =>
            onConfigChange({ ...config, typography: { ...config.typography, fontFamily: v } }),
          onFontSizeChange: (values) => {
            const px = values[0]
            if (px !== undefined)
              onConfigChange({
                ...config,
                typography: { ...config.typography, baseFontSize: `${px}px` },
              })
          },
          onRadiusChange: (values) => {
            const rem = values[0]
            if (rem !== undefined) onConfigChange({ ...config, radius: `${rem}rem` })
          },
          onReset: () => {
            onReset()
            announce(m.ds_theme_announce_reset())
          },
          onToggle,
        }}
      />
    </>
  )
}
