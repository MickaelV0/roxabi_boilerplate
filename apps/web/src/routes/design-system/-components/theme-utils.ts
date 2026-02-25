import type { ShadcnPreset, ThemeConfig } from '@repo/ui'
import {
  applyTheme,
  BASE_PRESETS,
  COLOR_PRESETS,
  deriveFullTheme,
  getComposedConfig,
  getComposedDerivedTheme,
  resetTheme,
  SHADOW_PRESETS,
} from '@repo/ui'
import { useCallback, useEffect, useState } from 'react'

export const STORAGE_KEY = 'roxabi-theme'

export type TabId = 'colors' | 'typography' | 'spacing' | 'components' | 'compositions'

export const SEED_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'destructive',
  'muted',
  'background',
  'foreground',
  'border',
] as const

const _zincPreset = BASE_PRESETS.find((p) => p.name === 'zinc')
if (!_zincPreset) throw new Error('Zinc preset not found in BASE_PRESETS')
export const ZINC_PRESET = _zincPreset
export const ZINC_CONFIG = getComposedConfig(ZINC_PRESET, null)

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

export function findBase(name: string): ShadcnPreset {
  return BASE_PRESETS.find((p) => p.name === name) ?? ZINC_PRESET
}

export function findColor(name: string | null): ShadcnPreset | null {
  if (!name) return null
  return COLOR_PRESETS.find((p) => p.name === name) ?? null
}

export function applyNonColorOverrides(
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

export function persistTheme(data: Record<string, unknown>) {
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

export function useDesignSystemTheme() {
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
