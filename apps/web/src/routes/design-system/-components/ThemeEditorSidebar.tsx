import type { ShadcnPreset, ThemeConfig } from '@repo/ui'
import { Button, cn, Separator } from '@repo/ui'
import { PaletteIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { m } from '@/paraglide/messages'

import type { SeedColorKey } from './ThemeEditorSections'
import {
  BasePresetsSection,
  ColorPresetsSection,
  RadiusSection,
  SeedColorsSection,
  ShadowsSection,
  ThemeFontControls,
} from './ThemeEditorSections'

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
  onColorChange: (key: SeedColorKey, v: string) => void
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

export { ThemeEditorSidebar, ThemeEditorTrigger, useThemeEditorBehavior }
