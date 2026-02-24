import type { ShadcnPreset, ThemeConfig } from '@repo/ui'
import { m } from '@/paraglide/messages'

import type { SeedColorKey } from './ThemeEditorSections'
import {
  ThemeEditorSidebar,
  ThemeEditorTrigger,
  useThemeEditorBehavior,
} from './ThemeEditorSidebar'

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

  function handleColorChange(key: SeedColorKey, oklchValue: string) {
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
