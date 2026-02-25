import type { ShadcnPreset, ThemeConfig, ThemeShadows } from '@repo/ui'
import {
  BASE_PRESETS,
  Button,
  COLOR_PRESETS,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from '@repo/ui'
import { m } from '@/paraglide/messages'

import { ColorPicker } from './ColorPicker'

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

type SeedColorKey = (typeof SEED_COLOR_KEYS)[number]

function getSeedColorLabels(): Record<SeedColorKey, string> {
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
  color: SeedColorKey
  against: SeedColorKey
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
function getContrastAgainst(key: SeedColorKey, config: ThemeConfig): string | undefined {
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
  onColorChange: (key: SeedColorKey, value: string) => void
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

export {
  SEED_COLOR_KEYS,
  BasePresetsSection,
  ColorPresetsSection,
  SeedColorsSection,
  ThemeFontControls,
  RadiusSection,
  ShadowsSection,
}
export type { SeedColorKey }
